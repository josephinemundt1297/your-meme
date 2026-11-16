import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Prisma } from "../dist/generated/prisma/client.js";
import { createImageDeletionService } from "../dist/modules/memes/image-deletion.service.js";
import { createRouteTest, resourceId, ownerId, png } from "./helpers/testApp.mjs";

test("import fixture storage IDs match their exact Cloudinary image paths", async () => {
  const rows = JSON.parse(await readFile(new URL("../prisma/test-memes.json", import.meta.url), "utf8"));
  for (const row of rows) {
    const path = new URL(row.imageUrl).pathname;
    const match = path.match(/^\/[^/]+\/image\/upload\/v\d+\/(.+)\.png$/);
    assert.ok(match, row.id);
    assert.equal(row.imageStorageId, decodeURIComponent(match[1]), row.id);
  }
});

test("a new upload succeeds without a subsequent like lookup", async (context) => {
  const client = await createRouteTest(context, { liked: true });
  client.dependencies.database.like.findMany = async () => { throw new Error("Like database unavailable"); };
  const form = new FormData();
  form.set("title", "Neues Meme");
  form.set("image", new Blob([png], { type: "image/png" }), "test.png");
  const result = await client.request("POST", "/api/memes", { body: form });
  assert.equal(result.status, 201);
  assert.equal(result.body.likedByMe, false);
  const write = client.calls.find(call => call.operation === "meme.create");
  assert.equal(write.args.data.imageStorageId, "test-only/new");
});

test("failed content transaction rolls back the job before any Cloudinary call", async (context) => {
  const client = await createRouteTest(context, { deleteFailure: true, folderMemeIds: [resourceId] });
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`)).status, 500);
  assert.equal(client.deletionJobs.size, 0);
  assert.equal(client.calls.filter(call => call.operation === "image.destroy").length, 0);
  assert.equal((await client.request("GET", `/api/memes/${resourceId}`)).status, 200);
  assert.equal(client.links.size, 1);
});

test("pending cleanup is private, retryable and removed completely on success", async (context) => {
  const options = { cloudFailure: true, folderMemeIds: [resourceId] };
  const client = await createRouteTest(context, options);
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`)).status, 503);
  assert.equal((await client.request("GET", `/api/memes/${resourceId}`)).status, 404);
  assert.equal((await client.request("GET", "/api/memes")).body.length, 0);
  assert.equal(client.links.size, 0);
  const job = client.deletionJobs.get(resourceId);
  assert.deepEqual(Object.keys(job).sort(), ["memeId", "ownerId", "imageStorageId", "createdAt", "nextAttemptAt"].sort());
  assert.equal(job.ownerId, ownerId);
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`, { user: "clerk-other" })).status, 403);
  options.cloudFailure = false;
  options.cloudResult = "not found";
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`)).status, 204);
  assert.equal(client.deletionJobs.size, 0);
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`)).status, 404);
  const effects = client.calls.map(call => call.operation);
  assert.ok(effects.indexOf("memeImageDeletion.upsert") < effects.indexOf("meme.delete"));
  assert.ok(effects.indexOf("meme.delete") < effects.indexOf("image.destroy"));
  for (const call of client.calls.filter(call => call.operation === "image.destroy")) {
    assert.equal(call.args.publicId, "test-only/image");
    assert.deepEqual(call.args.options, { resource_type: "image", invalidate: true });
  }
});

test("job cleanup DB failure remains recoverable after the image was deleted", async (context) => {
  const options = { cleanupDeleteFailure: true };
  const client = await createRouteTest(context, options);
  assert.equal((await client.request("DELETE", `/api/memes/${resourceId}`)).status, 503);
  assert.equal(client.deletionJobs.size, 1);
  options.cleanupDeleteFailure = false;
  options.cloudResult = "not found";
  // Eine neue Service-Instanz verwendet die gespeicherten Aufträge weiter.
  await createImageDeletionService(client.dependencies).retryPending();
  assert.equal(client.deletionJobs.size, 0);
});

test("background retries are bounded and defer failing jobs without logging identifiers", async (context) => {
  const client = await createRouteTest(context, { cloudFailure: true });
  const now = Date.now();
  const logs = [];
  context.mock.method(console, "error", (...args) => logs.push(args));
  for (let i = 0; i < 30; i++) {
    const id = `${String(i).padStart(8, "0")}-1111-4111-8111-111111111111`;
    client.deletionJobs.set(id, { memeId: id, ownerId, imageStorageId: "private-image-id", createdAt: new Date(now - 25 * 60 * 60 * 1000), nextAttemptAt: new Date(now - 1) });
  }
  await createImageDeletionService(client.dependencies).retryPending();
  assert.equal(client.calls.filter(call => call.operation === "image.destroy").length, 25);
  assert.equal([...client.deletionJobs.values()].filter(job => job.nextAttemptAt > now).length, 25);
  assert.ok(logs.some(args => args[0].includes("24 Stunden")));
  assert.ok(!JSON.stringify(logs).includes("private-image-id"));
  assert.ok(!JSON.stringify(logs).includes(ownerId));
});

function knownError(code) {
  return new Prisma.PrismaClientKnownRequestError("Private database details", { code, clientVersion: "test" });
}

for (const [method, path, model, operation, code, body, expected] of [
  ["PATCH", `/api/memes/${resourceId}`, "meme", "update", "P2025", { title: "Neu" }, 404],
  ["PATCH", `/api/comments/${resourceId}`, "comment", "update", "P2025", { content: "Neu" }, 404],
  ["PATCH", `/api/folders/${resourceId}`, "folder", "update", "P2025", { name: "Neu" }, 404],
  ["POST", `/api/memes/${resourceId}/comments`, "comment", "create", "P2003", { content: "Neu" }, 409],
  ["POST", `/api/memes/${resourceId}/like`, "like", "createMany", "P2003", undefined, 409],
  ["POST", `/api/folders/${resourceId}/memes`, "folderMeme", "createMany", "P2003", { memeId: resourceId }, 409],
]) {
  test(`${method} ${path} maps ${code} without disclosing database details`, async (context) => {
    const client = await createRouteTest(context);
    client.dependencies.database[model][operation] = async () => { throw knownError(code); };
    const result = await client.request(method, path, { body });
    assert.equal(result.status, expected);
    assert.ok(!JSON.stringify(result.body).includes("Private"));
  });
}

test("unexpected errors do not log raw database or request details", async (context) => {
  const logs = [];
  context.mock.method(console, "error", (...args) => logs.push(args));
  const client = await createRouteTest(context);
  client.dependencies.database.meme.update = async () => { throw new Error("secret-email@example.test"); };
  assert.equal((await client.request("PATCH", `/api/memes/${resourceId}`, { body: { title: "Neu" } })).status, 500);
  assert.ok(logs.length > 0);
  assert.ok(!JSON.stringify(logs).includes("secret-email"));
});

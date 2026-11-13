import assert from "node:assert/strict";
import test from "node:test";
import { createRouteTest, resourceId, ownerId, missingId, png } from "./helpers/testApp.mjs";

const knownRoutes = [
  ["GET", "/api/me"], ["POST", "/api/me/sync"],
  ["PATCH", `/api/memes/${resourceId}`], ["POST", "/api/memes"], ["DELETE", `/api/memes/${resourceId}`],
  ["POST", `/api/memes/${resourceId}/comments`], ["PATCH", `/api/comments/${resourceId}`], ["DELETE", `/api/comments/${resourceId}`],
  ["POST", `/api/memes/${resourceId}/like`], ["DELETE", `/api/memes/${resourceId}/like`],
  ["POST", "/api/folders"], ["GET", "/api/folders"], ["GET", `/api/folders/${resourceId}`],
  ["POST", `/api/folders/${resourceId}/memes`], ["DELETE", `/api/folders/${resourceId}/memes/${resourceId}`],
  ["PATCH", `/api/folders/${resourceId}`], ["DELETE", `/api/folders/${resourceId}`],
];

for (const [method, path] of knownRoutes) {
  test(`${method} ${path}: authentication still precedes validation`, async (context) => {
    const routeTest = await createRouteTest(context);
    const response = await routeTest.request(method, path, { user: null });
    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: "Bitte zuerst anmelden." });
    assert.equal(routeTest.calls.length, 0);
  });
}

test("health and database health retain response formats", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.deepEqual((await routeTest.request("GET", "/api/health", { user: null })).body, { status: "ok" });
  assert.deepEqual((await routeTest.request("GET", "/api/health/db", { user: null })).body, { status: "ok", database: "connected" });
});

test("database health failure remains 503", async (context) => {
  context.mock.method(console, "error", () => {});
  const routeTest = await createRouteTest(context, { databaseFailure: true });
  const response = await routeTest.request("GET", "/api/health/db");
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: "error", database: "disconnected" });
});

test("CORS and preflight still permit the existing frontend", async (context) => {
  const routeTest = await createRouteTest(context);
  const response = await routeTest.request("OPTIONS", "/api/folders", {
    user: null, headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" },
  });
  assert.equal(response.status, 204);
  assert.equal(response.cors, "http://localhost:5173");
});

test("malformed and oversized JSON still produce safe 400/413 responses", async (context) => {
  const routeTest = await createRouteTest(context);
  const malformed = await routeTest.request("POST", "/api/folders", { body: "{" });
  assert.equal(malformed.status, 400);
  assert.deepEqual(malformed.body, { error: "Ungültiges JSON. Bitte den Anfrageinhalt prüfen." });
  const oversized = await routeTest.request("POST", "/api/folders", { body: { name: "x".repeat(110000) } });
  assert.equal(oversized.status, 413);
  assert.deepEqual(oversized.body, { error: "Der Anfrageinhalt ist zu groß." });
});

test("unknown routes still return the JSON 404", async (context) => {
  const routeTest = await createRouteTest(context);
  const response = await routeTest.request("GET", "/api/unknown");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { error: "Route nicht gefunden." });
});

test("public list and detail retain fields and personal like status", async (context) => {
  const routeTest = await createRouteTest(context, { liked: true });
  const anonymous = await routeTest.request("GET", "/api/memes", { user: null });
  assert.equal(anonymous.body[0].likedByMe, false);
  const own = await routeTest.request("GET", `/api/memes/${resourceId}`);
  assert.equal(own.body.likedByMe, true);
  assert.equal(own.body.likeCount, 1);
  assert.equal(own.body.commentCount, 1);
  assert.equal(own.body.author.id, ownerId);
  assert.equal(own.body.imageStorageId, undefined);
  assert.equal(own.body._count, undefined);
});

test("public invalid and missing IDs keep distinct errors", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.equal((await routeTest.request("GET", "/api/memes/not-a-uuid", { user: null })).status, 400);
  assert.equal((await routeTest.request("GET", `/api/memes/${missingId}`, { user: null })).status, 404);
});

test("sync keeps its profile response and default role input", async (context) => {
  const routeTest = await createRouteTest(context);
  const response = await routeTest.request("POST", "/api/me/sync");
  assert.equal(response.status, 200);
  assert.equal(response.body.role, "USER");
  const write = routeTest.calls.find((call) => call.operation === "user.upsert").args;
  assert.equal(write.where.clerkId, "clerk-owner");
  assert.equal(write.create.role, undefined);
});

test("comment create and edit retain trimming, response and statuses", async (context) => {
  const routeTest = await createRouteTest(context);
  const created = await routeTest.request("POST", `/api/memes/${resourceId}/comments`, { body: { content: "  Hallo  " } });
  assert.equal(created.status, 201);
  assert.equal(created.body.content, "Hallo");
  const updated = await routeTest.request("PATCH", `/api/comments/${resourceId}`, { body: { content: "  Neu  " } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.content, "Neu");
  const empty = await routeTest.request("POST", `/api/memes/${resourceId}/comments`, { body: { content: " " } });
  assert.equal(empty.status, 400);
});

test("like and unlike use the own local ID and existing response fields", async (context) => {
  const routeTest = await createRouteTest(context);
  const liked = await routeTest.request("POST", `/api/memes/${resourceId}/like`);
  assert.deepEqual(liked.body, { memeId: resourceId, liked: true, likeCount: 1 });
  const write = routeTest.calls.find((call) => call.operation === "like.createMany").args;
  assert.equal(write.data.userId, ownerId);
  assert.equal(write.skipDuplicates, true);
  const removed = await routeTest.request("DELETE", `/api/memes/${resourceId}/like`);
  assert.equal(removed.body.liked, false);
  assert.equal(routeTest.calls.find((call) => call.operation === "like.deleteMany").args.where.userId, ownerId);
});

test("folder create and rename keep validation and responses", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.equal((await routeTest.request("POST", "/api/folders", { body: { name: " " } })).status, 400);
  const created = await routeTest.request("POST", "/api/folders", { body: { name: "  Favoriten  " } });
  assert.equal(created.status, 201);
  assert.equal(created.body.name, "Favoriten");
  const renamed = await routeTest.request("PATCH", `/api/folders/${resourceId}`, { body: { name: "  Neu  " } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.name, "Neu");
});

test("folder list uses only the current local owner", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.equal((await routeTest.request("GET", "/api/folders")).status, 200);
  assert.equal(routeTest.calls.find((call) => call.operation === "folder.findMany").args.where.userId, ownerId);
});

test("folder links remain idempotent and removing them never deletes a meme", async (context) => {
  const routeTest = await createRouteTest(context);
  for (let repetition = 0; repetition < 2; repetition++) {
    const response = await routeTest.request("POST", `/api/folders/${resourceId}/memes`, { body: { memeId: resourceId } });
    assert.deepEqual(response.body, { folderId: resourceId, memeId: resourceId, saved: true });
  }
  assert.equal(routeTest.links.size, 1);
  assert.equal((await routeTest.request("GET", `/api/folders/${resourceId}`)).body.memes.length, 1);
  const removed = await routeTest.request("DELETE", `/api/folders/${resourceId}/memes/${resourceId}`);
  assert.deepEqual(removed.body, { folderId: resourceId, memeId: resourceId, saved: false });
  assert.equal(routeTest.links.size, 0);
  assert.equal(routeTest.calls.filter((call) => call.operation === "meme.delete" || call.operation === "image.destroy").length, 0);
});

test("folder deletion deletes only the folder", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.equal((await routeTest.request("DELETE", `/api/folders/${resourceId}`)).status, 204);
  assert.equal(routeTest.calls.filter((call) => call.operation === "meme.delete" || call.operation === "image.destroy").length, 0);
  assert.equal((await routeTest.request("GET", `/api/memes/${resourceId}`)).status, 200);
});

for (const method of ["GET", "PATCH", "DELETE"]) {
  test(`foreign folder ${method} stays forbidden to a normal user`, async (context) => {
    const routeTest = await createRouteTest(context);
    const response = await routeTest.request(method, `/api/folders/${resourceId}`, {
      user: "clerk-other", ...(method === "PATCH" ? { body: { name: "Changed" } } : {}),
    });
    assert.equal(response.status, 403);
  });
}

function uploadBody({ image = png, filename = "test.png", type = "image/png", title = "  Upload  ", field = "image" } = {}) {
  const form = new FormData();
  form.append("title", title);
  if (image) form.append(field, new Blob([image], { type }), filename);
  return form;
}

test("multipart upload retains validation, owner and 201 response", async (context) => {
  const routeTest = await createRouteTest(context);
  const response = await routeTest.request("POST", "/api/memes", { body: uploadBody() });
  assert.equal(response.status, 201);
  assert.equal(response.body.title, "Upload");
  const write = routeTest.calls.find((call) => call.operation === "meme.create").args;
  assert.equal(write.data.userId, ownerId);
  assert.equal(write.data.imageStorageId, "test-only/new");
});

test("upload rejects missing file, wrong MIME, fake PNG and excess size", async (context) => {
  const routeTest = await createRouteTest(context);
  for (const body of [uploadBody({ image: null }), uploadBody({ type: "image/jpeg" }), uploadBody({ image: Buffer.from("not a PNG") })]) {
    assert.equal((await routeTest.request("POST", "/api/memes", { body })).status, 400);
  }
  const response = await routeTest.request("POST", "/api/memes", { body: uploadBody({ image: Buffer.alloc(5 * 1024 * 1024 + 1) }) });
  assert.equal(response.status, 413);
  assert.equal(routeTest.calls.filter((call) => call.operation === "image.upload").length, 0);
});

test("missing local profile still blocks upload, comments and likes with 409", async (context) => {
  const routeTest = await createRouteTest(context, { noProfile: true });
  assert.equal((await routeTest.request("POST", "/api/memes", { body: uploadBody() })).status, 409);
  assert.equal((await routeTest.request("POST", `/api/memes/${resourceId}/comments`, { body: { content: "Hallo" } })).status, 409);
  assert.equal((await routeTest.request("POST", `/api/memes/${resourceId}/like`)).status, 409);
  assert.equal(routeTest.calls.filter((call) => call.operation === "image.upload").length, 0);
});

test("DB failure after upload still cleans up only the new image", async (context) => {
  context.mock.method(console, "error", () => {});
  const routeTest = await createRouteTest(context, { createFailure: true });
  const response = await routeTest.request("POST", "/api/memes", { body: uploadBody() });
  assert.equal(response.status, 500);
  const effects = routeTest.calls.filter((call) => call.operation.startsWith("image.")).map((call) => call.operation);
  assert.deepEqual(effects, ["image.upload", "image.destroy"]);
  assert.equal(routeTest.calls.find((call) => call.operation === "image.destroy").args.publicId, "test-only/new");
});

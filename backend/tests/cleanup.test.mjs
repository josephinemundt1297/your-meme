import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createRequestLimiter } from "../dist/middleware/requestLimiter.js";
import { createRouteTest, serveTestApp, resourceId, png } from "./helpers/testApp.mjs";

test("pagination bounds database reads and retains the array response", async (context) => {
  const routeTest = await createRouteTest(context, { memeCount: 5, liked: true });
  const first = await routeTest.request("GET", "/api/memes?page=1&limit=2");
  const second = await routeTest.request("GET", "/api/memes?page=2&limit=2");
  const last = await routeTest.request("GET", "/api/memes?page=3&limit=2");
  assert.equal(first.status, 200);
  assert.equal(first.body.length, 2);
  assert.equal(first.body[0].likedByMe, true);
  assert.equal(first.body[1].likedByMe, false);
  assert.equal(first.hasMore, "true");
  assert.equal(first.page, "1");
  assert.equal(first.limit, "2");
  assert.ok(first.exposedHeaders.includes("X-Has-More"));
  assert.equal(second.body.length, 2);
  assert.ok(!first.body.some((meme) => meme.id === second.body[0].id));
  assert.equal(last.body.length, 1);
  assert.equal(last.hasMore, "false");
  const reads = routeTest.calls.filter((call) => call.operation === "meme.findMany");
  assert.deepEqual(reads.map((call) => [call.args.skip, call.args.take]), [[0, 3], [2, 3], [4, 3]]);
  assert.deepEqual(reads[0].args.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
});

test("default pagination is bounded and an exhausted page is empty", async (context) => {
  const routeTest = await createRouteTest(context, { memeCount: 52 });
  const first = await routeTest.request("GET", "/api/memes", { user: null });
  assert.equal(first.body.length, 50);
  assert.equal(first.limit, "50");
  assert.equal(first.hasMore, "true");
  const empty = await routeTest.request("GET", "/api/memes?page=5&limit=50", { user: null });
  assert.deepEqual(empty.body, []);
  assert.equal(empty.hasMore, "false");
  assert.equal(routeTest.calls.filter((call) => call.operation === "like.findMany").length, 0);
});

test("invalid pagination is rejected before database access", async (context) => {
  const routeTest = await createRouteTest(context);
  for (const query of ["page=0", "page=-1", "page=1.5", "page=10001", "page=999999999999999999999", "limit=101", "limit=0", "limit=", "limit=abc", "limit=2&limit=3", "page[x]=1"]) {
    assert.equal((await routeTest.request("GET", `/api/memes?${query}`)).status, 400, query);
  }
  assert.equal(routeTest.calls.length, 0);
  assert.equal((await routeTest.request("GET", "/api/memes?page=10000&limit=100")).status, 200);
});

for (const liked of [false, true]) {
  test(`Meme writes and folder contents reflect personal likes: ${liked}`, async (context) => {
    const routeTest = await createRouteTest(context, { liked });
    const form = new FormData();
    form.set("title", "Test");
    form.set("image", new Blob([png], { type: "image/png" }), "test.png");
    const created = await routeTest.request("POST", "/api/memes", { body: form });
    const updated = await routeTest.request("PATCH", `/api/memes/${resourceId}`, { body: { title: "Neu" } });
    assert.equal(created.status, 201);
    assert.equal(updated.status, 200);
    assert.equal(created.body.likedByMe, liked);
    assert.equal(updated.body.likedByMe, liked);
    assert.equal(created.body.imageStorageId, undefined);
    await routeTest.request("POST", `/api/folders/${resourceId}/memes`, { body: { memeId: resourceId } });
    const previousReads = routeTest.calls.filter((call) => call.operation === "like.findMany").length;
    const folder = await routeTest.request("GET", `/api/folders/${resourceId}`);
    assert.equal(folder.body.memes[0].likedByMe, liked);
    assert.equal(routeTest.calls.filter((call) => call.operation === "like.findMany").length, previousReads + 1);
    assert.equal(routeTest.calls.at(-1).args.where.user.clerkId, "clerk-owner");
  });
}

test("foreign and empty folders do not trigger like reads", async (context) => {
  const routeTest = await createRouteTest(context);
  assert.equal((await routeTest.request("GET", `/api/folders/${resourceId}`, { user: "clerk-other" })).status, 403);
  assert.deepEqual((await routeTest.request("GET", `/api/folders/${resourceId}`)).body.memes, []);
  assert.equal(routeTest.calls.filter((call) => call.operation === "like.findMany").length, 0);
});

test("upload error names PNG consistently", async (context) => {
  const routeTest = await createRouteTest(context);
  const form = new FormData();
  form.set("title", "Test");
  form.set("image", new Blob([png], { type: "image/jpeg" }), "wrong.jpg");
  const response = await routeTest.request("POST", "/api/memes", { body: form });
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Bitte genau ein PNG-Bild im Feld image senden." });
});

test("request limit blocks repeated requests, skips preflight and expires", async (context) => {
  let now = 100_000;
  context.mock.method(Date, "now", () => now);
  const app = express();
  app.use(createRequestLimiter({ maxRequests: 2, windowMs: 60_000 }));
  app.get("/limited", (_req, res) => res.json({ ok: true }));
  app.options("/limited", (_req, res) => res.sendStatus(204));
  const client = await serveTestApp(app);
  context.after(() => client.close());
  assert.equal((await client.request("OPTIONS", "/limited")).status, 204);
  assert.equal((await client.request("GET", "/limited")).status, 200);
  assert.equal((await client.request("GET", "/limited")).status, 200);
  const blocked = await client.request("GET", "/limited", { headers: { "X-Forwarded-For": "203.0.113.9" } });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.retryAfter, "60");
  now += 30_000;
  assert.equal((await client.request("GET", "/limited")).retryAfter, "30");
  now += 30_000;
  assert.equal((await client.request("GET", "/limited")).status, 200);
});

test("actual API enforces its general request limit", async (context) => {
  const routeTest = await createRouteTest(context);
  for (let index = 0; index < 300; index++) {
    assert.equal((await routeTest.request("GET", "/api/health", { user: null })).status, 200);
  }
  const response = await routeTest.request("GET", "/api/health", { user: null });
  assert.equal(response.status, 429);
  assert.ok(Number(response.retryAfter) > 0);
});

test("actual API bounds writes before authentication or database work", async (context) => {
  const routeTest = await createRouteTest(context);
  for (let index = 0; index < 60; index++) {
    assert.equal((await routeTest.request("POST", "/api/me/sync", { user: null })).status, 401);
  }
  assert.equal((await routeTest.request("POST", "/api/me/sync", { user: null })).status, 429);
  assert.equal(routeTest.calls.length, 0);
});

test("actual API applies a stricter upload limit without touching images", async (context) => {
  const routeTest = await createRouteTest(context);
  for (let index = 0; index < 10; index++) {
    assert.equal((await routeTest.request("POST", "/api/memes", { user: null })).status, 401);
  }
  assert.equal((await routeTest.request("POST", "/api/memes", { user: null })).status, 429);
  assert.equal(routeTest.calls.length, 0);
});

test("limiter separates clients and bounds its in-memory client table", (context) => {
  let now = 100_000;
  context.mock.method(Date, "now", () => now);
  const limiter = createRequestLimiter({ maxRequests: 1, windowMs: 60_000 });
  function request(client) {
    let status = 200;
    let passed = false;
    const response = {
      setHeader() {},
      status(value) { status = value; return this; },
      json() {},
    };
    limiter({ method: "GET", ip: client }, response, () => { passed = true; });
    return { status, passed };
  }
  for (let index = 0; index < 10_000; index++) {
    assert.deepEqual(request(`client-${index}`), { status: 200, passed: true });
  }
  assert.deepEqual(request("client-0"), { status: 429, passed: false });
  assert.deepEqual(request("new-client"), { status: 503, passed: false });
  now += 60_000;
  assert.deepEqual(request("new-client"), { status: 200, passed: true });
});

test("several folder memes share one personal-like query", async (context) => {
  const memeIds = [resourceId, "44444444-4444-4444-8444-444444444444", "55555555-5555-4555-8555-555555555555"];
  const routeTest = await createRouteTest(context, { liked: true, folderMemeIds: memeIds });
  const response = await routeTest.request("GET", `/api/folders/${resourceId}`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.memes.map((meme) => meme.likedByMe), [true, false, false]);
  const reads = routeTest.calls.filter((call) => call.operation === "like.findMany");
  assert.equal(reads.length, 1);
  assert.deepEqual(reads[0].args.where.memeId.in, memeIds);
});

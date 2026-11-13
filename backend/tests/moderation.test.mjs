import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");
const resourceId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";

// Execute the actual registered handlers with isolated Clerk/DB/Cloudinary doubles.
// These tests do not connect to services or change real accounts and images.
function setup(method, path, options = {}) {
  const start = source.indexOf(`app.${method}("${path}",`);
  assert.notEqual(start, -1, `Route missing: ${method} ${path}`);
  const end = source.indexOf("\n});", start);
  assert.notEqual(end, -1, "Route ending missing");

  const calls = { roleReads: [], deletes: [], cloud: [], writes: [] };
  const record = {
    id: resourceId,
    userId: ownerId,
    imageStorageId: "test-only/image",
    user: { clerkId: "clerk-owner" },
    folderMemes: [],
  };
  const model = {
    findUnique: async () => options.missing ? null : record,
    delete: async (args) => { calls.deletes.push(args); return record; },
    update: async (args) => { calls.writes.push(args); return record; },
  };
  const prisma = {
    meme: model,
    comment: model,
    folder: model,
    user: {
      findUnique: async (args) => {
        calls.roleReads.push(args);
        if (options.roleFailure) throw new Error("Simulated DB failure");
        return options.noProfile ? null : { role: options.role ?? "USER" };
      },
    },
  };
  let handler;
  vm.runInNewContext(source.slice(start, end + "\n});".length), {
    app: { [method]: (_path, callback) => { handler = callback; } },
    getAuth: (req) => ({ userId: req.testUserId }),
    prisma,
    cloudinary: { uploader: { destroy: async (...args) => {
      calls.cloud.push(args);
      if (options.cloudFailure) throw new Error("Simulated Cloudinary failure");
      return { result: options.cloudResult ?? "ok" };
    } } },
    isValidUuid: () => true,
    createMemeSchema: { pick: () => ({ safeParse: () => ({ success: true, data: { title: "Changed" } }) }) },
    createCommentSchema: { safeParse: () => ({ success: true, data: { content: "Changed" } }) },
    createFolderSchema: { safeParse: () => ({ success: true, data: { name: "Changed" } }) },
    memeSelect: {},
    console: { error() {} },
  });
  return {
    calls,
    async request(user = "clerk-other", body = {}) {
      const response = {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
        send(data) { this.body = data; return this; },
      };
      await handler({ testUserId: user, params: { id: resourceId }, body }, response);
      return response;
    },
  };
}

for (const path of ["/api/memes/:id", "/api/comments/:id"]) {
  test(`${path}: anonymous deletion is rejected`, async () => {
    const routeTest = setup("delete", path);
    assert.equal((await routeTest.request(null)).statusCode, 401);
    assert.equal(routeTest.calls.roleReads.length + routeTest.calls.deletes.length + routeTest.calls.cloud.length, 0);
  });

  test(`${path}: normal user cannot delete foreign content or forge ADMIN in body`, async () => {
    const routeTest = setup("delete", path);
    assert.equal((await routeTest.request("clerk-other", { role: "ADMIN", userId: ownerId })).statusCode, 403);
    assert.equal(routeTest.calls.deletes.length + routeTest.calls.cloud.length, 0);
    assert.equal(routeTest.calls.roleReads[0].where.clerkId, "clerk-other");
    assert.equal(routeTest.calls.roleReads[0].select.role, true);
  });

  test(`${path}: owner can still delete own content`, async () => {
    const routeTest = setup("delete", path);
    assert.equal((await routeTest.request("clerk-owner")).statusCode, 204);
    assert.equal(routeTest.calls.deletes.length, 1);
    assert.equal(routeTest.calls.deletes[0].where.userId, ownerId);
    assert.equal(routeTest.calls.cloud.length, path.includes("memes") ? 1 : 0);
  });

  test(`${path}: ADMIN can delete foreign content`, async () => {
    const routeTest = setup("delete", path, { role: "ADMIN" });
    assert.equal((await routeTest.request()).statusCode, 204);
    assert.equal(routeTest.calls.roleReads[0].where.clerkId, "clerk-other");
    assert.equal(routeTest.calls.deletes[0].where.id, resourceId);
    assert.equal(routeTest.calls.deletes[0].where.userId, ownerId);
    assert.equal(routeTest.calls.cloud.length, path.includes("memes") ? 1 : 0);
  });

  test(`${path}: missing profile grants no ADMIN rights`, async () => {
    const routeTest = setup("delete", path, { noProfile: true });
    assert.equal((await routeTest.request()).statusCode, 403);
    assert.equal(routeTest.calls.deletes.length + routeTest.calls.cloud.length, 0);
  });

  test(`${path}: role lookup failure prevents deletion`, async () => {
    const routeTest = setup("delete", path, { roleFailure: true });
    assert.equal((await routeTest.request()).statusCode, 500);
    assert.equal(routeTest.calls.deletes.length + routeTest.calls.cloud.length, 0);
  });

  test(`${path}: missing content remains 404`, async () => {
    const routeTest = setup("delete", path, { role: "ADMIN", missing: true });
    assert.equal((await routeTest.request()).statusCode, 404);
    assert.equal(routeTest.calls.deletes.length + routeTest.calls.cloud.length, 0);
  });

  test(`${path}: ADMIN still cannot edit foreign content`, async () => {
    const routeTest = setup("patch", path, { role: "ADMIN" });
    assert.equal((await routeTest.request()).statusCode, 403);
    assert.equal(routeTest.calls.writes.length, 0);
  });
}

test("Cloudinary failure prevents database deletion", async () => {
  const routeTest = setup("delete", "/api/memes/:id", { role: "ADMIN", cloudFailure: true });
  assert.equal((await routeTest.request()).statusCode, 500);
  assert.equal(routeTest.calls.deletes.length, 0);
});

test("already absent Cloudinary image permits deletion retry", async () => {
  const routeTest = setup("delete", "/api/memes/:id", { role: "ADMIN", cloudResult: "not found" });
  assert.equal((await routeTest.request()).statusCode, 204);
  assert.equal(routeTest.calls.deletes.length, 1);
});

for (const method of ["get", "patch", "delete"]) {
  test(`ADMIN cannot ${method} another user's private folder`, async () => {
    const routeTest = setup(method, "/api/folders/:id", { role: "ADMIN" });
    assert.equal((await routeTest.request()).statusCode, 403);
    assert.equal(routeTest.calls.deletes.length + routeTest.calls.writes.length, 0);
  });
}

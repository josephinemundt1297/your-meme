import assert from "node:assert/strict";
import test from "node:test";
import { createRouteTest, resourceId, ownerId } from "./helpers/testApp.mjs";

for (const resource of ["memes", "comments"]) {
  const path = `/api/${resource}/${resourceId}`;
  const deleteOperation = resource === "memes" ? "meme.delete" : "comment.delete";
  const deleted = (routeTest) => routeTest.calls.filter((call) => call.operation === deleteOperation);
  const images = (routeTest) => routeTest.calls.filter((call) => call.operation === "image.destroy");

  test(`${resource}: anonymous deletion is rejected`, async (context) => {
    const routeTest = await createRouteTest(context);
    assert.equal((await routeTest.request("DELETE", path, { user: null })).status, 401);
    assert.equal(routeTest.calls.length, 0);
  });

  test(`${resource}: normal user cannot delete foreign content or forge ADMIN`, async (context) => {
    const routeTest = await createRouteTest(context);
    const response = await routeTest.request("DELETE", path, { user: "clerk-other", body: { role: "ADMIN", userId: ownerId } });
    assert.equal(response.status, 403);
    assert.equal(deleted(routeTest).length + images(routeTest).length, 0);
    assert.equal(routeTest.calls.find((call) => call.operation === "user.findUnique").args.where.clerkId, "clerk-other");
  });

  test(`${resource}: owner can still delete own content`, async (context) => {
    const routeTest = await createRouteTest(context);
    const response = await routeTest.request("DELETE", path);
    assert.equal(response.status, 204);
    assert.equal(response.body, undefined);
    assert.equal(deleted(routeTest)[0].args.where.userId, ownerId);
    assert.equal(images(routeTest).length, resource === "memes" ? 1 : 0);
  });

  test(`${resource}: ADMIN can delete foreign content`, async (context) => {
    const routeTest = await createRouteTest(context);
    assert.equal((await routeTest.request("DELETE", path, { user: "clerk-admin" })).status, 204);
    assert.equal(deleted(routeTest)[0].args.where.id, resourceId);
    assert.equal(deleted(routeTest)[0].args.where.userId, ownerId);
    assert.equal(images(routeTest).length, resource === "memes" ? 1 : 0);
  });

  test(`${resource}: missing profile grants no ADMIN rights`, async (context) => {
    const routeTest = await createRouteTest(context, { noProfile: true });
    assert.equal((await routeTest.request("DELETE", path, { user: "clerk-other" })).status, 403);
    assert.equal(deleted(routeTest).length + images(routeTest).length, 0);
  });

  test(`${resource}: role lookup failure prevents deletion`, async (context) => {
    const routeTest = await createRouteTest(context, { roleFailure: true });
    assert.equal((await routeTest.request("DELETE", path, { user: "clerk-other" })).status, 500);
    assert.equal(deleted(routeTest).length + images(routeTest).length, 0);
  });

  test(`${resource}: missing content remains 404`, async (context) => {
    const routeTest = await createRouteTest(context, { missing: true });
    assert.equal((await routeTest.request("DELETE", path, { user: "clerk-admin" })).status, 404);
    assert.equal(deleted(routeTest).length + images(routeTest).length, 0);
  });

  test(`${resource}: ADMIN still cannot edit foreign content`, async (context) => {
    const routeTest = await createRouteTest(context);
    assert.equal((await routeTest.request("PATCH", path, { user: "clerk-admin", body: { title: "Changed", content: "Changed" } })).status, 403);
    assert.equal(routeTest.calls.filter((call) => call.operation.endsWith(".update")).length, 0);
  });
}

test("Cloudinary failure prevents database deletion", async (context) => {
  const routeTest = await createRouteTest(context, { cloudFailure: true });
  assert.equal((await routeTest.request("DELETE", `/api/memes/${resourceId}`, { user: "clerk-admin" })).status, 500);
  assert.equal(routeTest.calls.filter((call) => call.operation === "meme.delete").length, 0);
});

test("already absent Cloudinary image permits deletion retry", async (context) => {
  const routeTest = await createRouteTest(context, { cloudResult: "not found" });
  assert.equal((await routeTest.request("DELETE", `/api/memes/${resourceId}`, { user: "clerk-admin" })).status, 204);
});

for (const method of ["GET", "PATCH", "DELETE"]) {
  test(`ADMIN cannot ${method} another user's private folder`, async (context) => {
    const routeTest = await createRouteTest(context);
    const response = await routeTest.request(method, `/api/folders/${resourceId}`, {
      user: "clerk-admin", ...(method === "PATCH" ? { body: { name: "Changed" } } : {}),
    });
    assert.equal(response.status, 403);
    assert.equal(routeTest.calls.filter((call) => /\.(delete|update)$/.test(call.operation)).length, 0);
  });
}

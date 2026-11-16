import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { categories } from "../dist/validators/category.js";
import { createRouteTest, resourceId, png } from "./helpers/testApp.mjs";

// Unabhängiger Vertrag: Entfernte Kategorien dürfen nicht unbemerkt Tests entfernen.
const expectedCategories = [
  "Ohne Kategorie", "Programmieren", "Alltag", "Arbeit", "Sport", "Gaming",
  "Tech", "Animal", "Movies", "Outdoor", "Study", "Drinks", "Food",
  "Holiday", "Book", "Meeting",
];

test("API supports the complete agreed category contract", () => {
  assert.deepEqual([...categories].sort(), [...expectedCategories].sort());
});

test("SQL category constraint matches the agreed category contract", async () => {
  const sql = await readFile(new URL(
    "../prisma/migrations/20261116093000_add_meme_category/migration.sql", import.meta.url,
  ), "utf8");
  const constraint = sql.match(/ADD CONSTRAINT "Meme_category_check"\s+CHECK\s*\("category" IN \(([^;]+)\)\);/);
  assert.ok(constraint, "Der Kategorien-CHECK muss vorhanden sein.");
  const sqlCategories = [...constraint[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(sqlCategories.sort(), [...expectedCategories].sort());
});

function upload(category) {
  const body = new FormData();
  body.set("title", "Kategorie-Test");
  body.set("image", new Blob([png], { type: "image/png" }), "test.png");
  if (category !== undefined) body.set("category", category);
  return body;
}

for (const category of expectedCategories) {
  test(`${category}: public filter, pagination and owner assignment`, async (context) => {
    const otherCategory = category === "Sport" ? "Alltag" : "Sport";
    const client = await createRouteTest(context, {
      memeCategories: [category, otherCategory, category],
    });
    const query = new URLSearchParams({ category, limit: "1" });
    const first = await client.request("GET", `/api/memes?${query}`, { user: null });
    query.set("page", "2");
    const second = await client.request("GET", `/api/memes?${query}`, { user: null });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(first.body.length, 1);
    assert.equal(second.body.length, 1);
    assert.equal(first.body[0].category, category);
    assert.equal(second.body[0].category, category);
    assert.notEqual(first.body[0].id, second.body[0].id);
    assert.equal(first.hasMore, "true");
    assert.equal(second.hasMore, "false");
    assert.equal(client.calls[0].args.where.category, category);

    const assigned = await client.request("PATCH", `/api/memes/${resourceId}`, { body: { category } });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.category, category);
    const detail = await client.request("GET", `/api/memes/${resourceId}`, { user: null });
    assert.equal(detail.body.category, category);
  });
}

test("category filters before pagination and preserves personal likes", async (context) => {
  const client = await createRouteTest(context, {
    memeCategories: ["Alltag", "Sport", "Alltag", "Gaming", "Alltag"], liked: true,
  });
  const first = await client.request("GET", "/api/memes?category=Alltag&limit=2");
  const second = await client.request("GET", "/api/memes?category=Alltag&limit=2&page=2");
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.map((meme) => meme.category), ["Alltag", "Alltag"]);
  assert.deepEqual(first.body.map((meme) => meme.likedByMe), [true, false]);
  assert.equal(first.hasMore, "true");
  assert.equal(second.body.length, 1);
  assert.equal(second.body[0].category, "Alltag");
  assert.equal(second.hasMore, "false");
  assert.ok(!first.body.some((meme) => meme.id === second.body[0].id));
  const reads = client.calls.filter((call) => call.operation === "meme.findMany");
  assert.deepEqual(reads.map(({ args }) => [args.where, args.skip, args.take]), [
    [{ category: "Alltag" }, 0, 3], [{ category: "Alltag" }, 2, 3],
  ]);
});

test("public category queries, no filter and empty categories retain array responses", async (context) => {
  const client = await createRouteTest(context, { memeCategories: ["Alltag", "Sport", "Ohne Kategorie"] });
  const all = await client.request("GET", "/api/memes", { user: null });
  assert.equal(all.body.length, 3);
  assert.equal(client.calls[0].args.where, undefined);
  const everyday = await client.request("GET", "/api/memes?category=Alltag", { user: null });
  assert.equal(everyday.body.length, 1);
  assert.equal(everyday.body[0].likedByMe, false);
  const empty = await client.request("GET", "/api/memes?category=Gaming", { user: null });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body, []);
  assert.equal(empty.hasMore, "false");
  const unassigned = await client.request("GET", "/api/memes?category=Ohne%20Kategorie", { user: null });
  assert.equal(unassigned.body[0].category, "Ohne Kategorie");
});

test("invalid categories and unknown query fields fail before database access", async (context) => {
  const client = await createRouteTest(context);
  for (const query of ["category=", "category=alltag", "category=Unbekannt", "category=Alltag&category=Sport", "category[x]=Alltag", "category=Alltag&extra=1"]) {
    assert.equal((await client.request("GET", `/api/memes?${query}`)).status, 400, query);
  }
  assert.equal(client.calls.length, 0);
});

test("upload accepts each menu category and defaults omitted categories", async (context) => {
  // Separate apps keep the existing ten-upload rate limit intact.
  for (const category of [...expectedCategories, undefined]) {
    const client = await createRouteTest(context);
    const result = await client.request("POST", "/api/memes", { body: upload(category) });
    assert.equal(result.status, 201, category);
    assert.equal(result.body.category, category ?? "Ohne Kategorie");
    const write = client.calls.find((call) => call.operation === "meme.create");
    assert.equal(write.args.data.category, category ?? "Ohne Kategorie");
  }
});

test("category reassignment moves only the edited meme between public filters", async (context) => {
  const client = await createRouteTest(context, {
    memeCategories: ["Alltag", "Alltag", "Sport"],
  });
  const list = async (category) => {
    const response = await client.request("GET", `/api/memes?${new URLSearchParams({ category })}`, { user: null });
    assert.equal(response.status, 200);
    return response.body;
  };
  const before = await list("Alltag");
  assert.equal(before.length, 2);
  const unchangedId = before.find((meme) => meme.id !== resourceId).id;
  const sportId = (await list("Sport"))[0].id;
  const patched = await client.request("PATCH", `/api/memes/${resourceId}`, { body: { category: "Gaming" } });
  assert.equal(patched.status, 200);
  assert.deepEqual((await list("Alltag")).map((meme) => meme.id), [unchangedId]);
  assert.deepEqual((await list("Gaming")).map((meme) => meme.id), [resourceId]);
  assert.deepEqual((await list("Sport")).map((meme) => meme.id), [sportId]);
  assert.equal((await client.request("GET", `/api/memes/${resourceId}`, { user: null })).body.category, "Gaming");
});

test("invalid upload categories never reach the database or image storage", async (context) => {
  const client = await createRouteTest(context);
  for (const category of ["", "Unbekannt", "alltag"]) {
    assert.equal((await client.request("POST", "/api/memes", { body: upload(category) })).status, 400);
  }
  const duplicate = upload("Alltag");
  duplicate.append("category", "Sport");
  assert.equal((await client.request("POST", "/api/memes", { body: duplicate })).status, 400);
  assert.equal(client.calls.length, 0);
});

test("owner can assign existing memes; title-only edits preserve the category", async (context) => {
  const client = await createRouteTest(context, { liked: true, folderMemeIds: [resourceId] });
  const updated = await client.request("PATCH", `/api/memes/${resourceId}`, { body: { category: "Alltag" } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, "Test-Meme");
  assert.equal(updated.body.category, "Alltag");
  assert.equal(updated.body.likedByMe, true);
  const titleOnly = await client.request("PATCH", `/api/memes/${resourceId}`, { body: { title: "Neuer Titel" } });
  assert.equal(titleOnly.status, 200);
  assert.equal(titleOnly.body.category, "Alltag");
  assert.deepEqual(client.calls.filter((call) => call.operation === "meme.update").map((call) => call.args.data), [
    { category: "Alltag" }, { title: "Neuer Titel" },
  ]);
  assert.equal((await client.request("GET", `/api/memes/${resourceId}`)).body.category, "Alltag");
  assert.equal((await client.request("GET", `/api/folders/${resourceId}`)).body.memes[0].category, "Alltag");
  const both = await client.request("PATCH", `/api/memes/${resourceId}`, { body: { title: "  Beides  ", category: "Sport" } });
  assert.equal(both.body.title, "Beides");
  assert.equal(both.body.category, "Sport");
});

test("category edits reject invalid values and preserve owner-only permission", async (context) => {
  const client = await createRouteTest(context);
  for (const body of [{}, { category: null }, { category: "" }, { category: "Falsch" }, { category: ["Alltag"] }]) {
    assert.equal((await client.request("PATCH", `/api/memes/${resourceId}`, { body })).status, 400);
  }
  assert.equal(client.calls.length, 0);
  for (const user of [null, "clerk-other", "clerk-admin"]) {
    assert.equal((await client.request("PATCH", `/api/memes/${resourceId}`, { user, body: { category: "Alltag" } })).status, user ? 403 : 401);
  }
  assert.equal(client.calls.filter((call) => call.operation === "meme.update").length, 0);
});

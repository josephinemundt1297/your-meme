import { once } from "node:events";
import { createApp } from "../../dist/app.js";

export const resourceId = "11111111-1111-4111-8111-111111111111";
export const ownerId = "22222222-2222-4222-8222-222222222222";
export const missingId = "00000000-0000-4000-8000-000000000000";
export const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

// All services are isolated. No real Clerk account, database or image is touched.
export function createTestDependencies(options = {}) {
  const calls = [];
  const links = new Set(options.folderMemeIds ?? []);
  const deletedModels = new Set();
  let name = "Meine Memes";
  let title = "Test-Meme";
  const createdAt = new Date("2026-11-13T09:00:00.000Z");
  const userFor = (clerkId) => ({
    id: clerkId === "clerk-owner" ? ownerId : "33333333-3333-4333-8333-333333333333",
    clerkId,
    username: clerkId === "clerk-owner" ? "Besitzer" : "Testnutzer",
    role: clerkId === "clerk-admin" ? "ADMIN" : options.role ?? "USER",
  });
  const record = () => ({
    id: resourceId, title, name, content: "Testkommentar", userId: ownerId,
    imageStorageId: "test-only/image", imageUrl: "https://images.example/test.png",
    createdAt, user: userFor("clerk-owner"), _count: { likes: options.liked ? 1 : 0, comments: 1 },
    folderMemes: [...links].map((memeId) => ({ meme: { ...recordWithoutFolders(), id: memeId } })),
  });
  function recordWithoutFolders() {
    return { id: resourceId, title, imageUrl: "https://images.example/test.png", userId: ownerId,
      createdAt, user: { id: ownerId, username: "Besitzer" }, _count: { likes: options.liked ? 1 : 0, comments: 1 } };
  }
  const trace = (operation, args) => { calls.push({ operation, args }); };
  function selectFields(value, selection) {
    if (!selection || value == null) return value;
    if (Array.isArray(value)) return value.map((entry) => selectFields(entry, selection));
    return Object.fromEntries(Object.entries(selection).map(([field, selected]) => [
      field, selected === true ? value[field] : selectFields(value[field], selected.select),
    ]));
  }
  const contentModel = (modelName) => ({
    async findUnique(args) {
      trace(`${modelName}.findUnique`, args);
      return options.missing || deletedModels.has(modelName) || args.where.id !== resourceId ? null : selectFields(record(), args.select);
    },
    async findMany(args) {
      trace(`${modelName}.findMany`, args);
      if (deletedModels.has(modelName)) return [];
      const rows = Array.from({ length: modelName === "meme" ? options.memeCount ?? 1 : 1 }, (_, index) => ({
        ...record(),
        id: index === 0 ? resourceId : `${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`,
        createdAt: new Date(createdAt.getTime() - index * 1000),
      }));
      const start = args.skip ?? 0;
      return rows.slice(start, args.take === undefined ? undefined : start + args.take)
        .map((row) => selectFields(row, args.select));
    },
    async create(args) {
      trace(`${modelName}.create`, args);
      if (options.createFailure) throw new Error("Simulierter Datenbankfehler");
      return selectFields({ ...record(), ...args.data }, args.select);
    },
    async update(args) {
      trace(`${modelName}.update`, args);
      if (args.data.name) name = args.data.name;
      if (args.data.title) title = args.data.title;
      return selectFields({ ...record(), ...args.data }, args.select);
    },
    async delete(args) {
      trace(`${modelName}.delete`, args);
      if (options.deleteFailure) throw new Error("Simulierter Datenbankfehler");
      deletedModels.add(modelName);
      links.clear();
      return record();
    },
  });
  const database = {
    meme: contentModel("meme"), comment: contentModel("comment"), folder: contentModel("folder"),
    user: {
      async findUnique(args) {
        trace("user.findUnique", args);
        if (options.roleFailure) throw new Error("Simulierter Rollen-Lesefehler");
        return options.noProfile ? null : userFor(args.where.clerkId);
      },
      async upsert(args) { trace("user.upsert", args); return userFor(args.where.clerkId); },
    },
    like: {
      async findMany(args) { trace("like.findMany", args); return options.liked ? [{ memeId: resourceId }] : []; },
      async findFirst(args) { trace("like.findFirst", args); return options.liked ? { memeId: resourceId } : null; },
      async createMany(args) { trace("like.createMany", args); return { count: 1 }; },
      async deleteMany(args) { trace("like.deleteMany", args); return { count: 1 }; },
      async count(args) { trace("like.count", args); return 1; },
    },
    folderMeme: {
      async createMany(args) {
        trace("folderMeme.createMany", args);
        const before = links.size;
        links.add(args.data.memeId);
        return { count: links.size - before };
      },
      async deleteMany(args) { trace("folderMeme.deleteMany", args); return { count: Number(links.delete(args.where.memeId)) }; },
    },
    async $queryRaw(...args) {
      trace("database.health", args);
      if (options.databaseFailure) throw new Error("Simulierter DB-Ausfall");
      return [{ value: 1 }];
    },
  };
  const dependencies = {
    database,
    authenticate: (_req, _res, next) => next(),
    readUserId: (request) => request.headers.authorization?.replace(/^Bearer /, "") || null,
    async getClerkUser(userId) {
      trace("clerk.getUser", { userId });
      return { username: "Testnutzer", firstName: null };
    },
    imageStorage: {
      async upload(buffer) {
        trace("image.upload", { bytes: buffer.length });
        if (options.uploadFailure) throw new Error("Simulierter Uploadfehler");
        return { imageUrl: "https://images.example/new.png", imageStorageId: "test-only/new" };
      },
      async destroy(publicId, imageOptions) {
        trace("image.destroy", { publicId, options: imageOptions });
        if (options.cloudFailure) throw new Error("Simulierter Bildspeicherfehler");
        return { result: options.cloudResult ?? "ok" };
      },
    },
  };
  return { dependencies, calls, links };
}

export async function serveTestApp(app) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = `http://127.0.0.1:${server.address().port}`;
  return {
    async request(method, path, { user = "clerk-owner", body, headers = {} } = {}) {
      if (user) headers = { ...headers, Authorization: `Bearer ${user}` };
      if (body !== undefined && !(body instanceof FormData)) {
        headers = { "Content-Type": "application/json", ...headers };
        body = typeof body === "string" ? body : JSON.stringify(body);
      }
      const response = await fetch(address + path, { method, headers, body });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : undefined,
        contentType: response.headers.get("content-type"), cors: response.headers.get("access-control-allow-origin"),
        page: response.headers.get("x-page"), limit: response.headers.get("x-limit"),
        hasMore: response.headers.get("x-has-more"), retryAfter: response.headers.get("retry-after"),
        exposedHeaders: response.headers.get("access-control-expose-headers") };
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    },
  };
}

export async function createRouteTest(context, options = {}) {
  const fixtures = createTestDependencies(options);
  const client = await serveTestApp(createApp(fixtures.dependencies));
  context.after(() => client.close());
  return { ...fixtures, ...client };
}

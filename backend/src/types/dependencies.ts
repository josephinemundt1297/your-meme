import type { Request, RequestHandler } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";

// Geschützte Routen erhalten diese Kennung durch requireAuth vor dem Controller.
export type ApiHandler = RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  Request["query"],
  { clerkUserId: string }
>;
export type ReadUserId = (
  request: Request<Record<string, string>, unknown, unknown>,
) => string | null | undefined;

export type Database = Pick<
  PrismaClient,
  "user" | "meme" | "comment" | "like" | "folder" | "folderMeme" | "$queryRaw"
>;

export type ImageStorage = {
  upload(buffer: Buffer): Promise<{ imageUrl: string; imageStorageId: string }>;
  destroy(
    publicId: string,
    options?: { resource_type: "image"; invalidate?: boolean },
  ): Promise<{ result: string }>;
};

export type AppDependencies = {
  database: Database;
  imageStorage: ImageStorage;
  getClerkUser(
    clerkUserId: string,
  ): Promise<{ username: string | null; firstName: string | null }>;
  authenticate: RequestHandler;
  readUserId: ReadUserId;
};

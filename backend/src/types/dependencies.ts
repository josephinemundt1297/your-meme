import type { Request, RequestHandler } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";

export type ApiHandler = RequestHandler<Record<string, string>, unknown, unknown>;
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

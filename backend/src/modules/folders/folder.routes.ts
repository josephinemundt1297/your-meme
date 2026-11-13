import { requireAuth } from "../../middleware/requireAuth.js";
import type { ReadUserId } from "../../types/dependencies.js";
import { Router } from "express";
import type { createFolderController } from "./folder.controller.js";

export function createFolderRouter(
  controller: ReturnType<typeof createFolderController>,
  readUserId: ReadUserId,
) {
  const router = Router();
  const authenticated = requireAuth(readUserId);

  router.post("/folders", authenticated, controller.createFolder);
  router.get("/folders", authenticated, controller.listFolders);
  router.get("/folders/:id", authenticated, controller.getFolder);
  router.post("/folders/:id/memes", authenticated, controller.addMeme);
  router.delete("/folders/:id/memes/:memeId", authenticated, controller.removeMeme);
  router.patch("/folders/:id", authenticated, controller.renameFolder);
  router.delete("/folders/:id", authenticated, controller.deleteFolder);

  return router;
}

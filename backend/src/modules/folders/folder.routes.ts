import { Router } from "express";
import type { createFolderController } from "./folder.controller.js";

export function createFolderRouter(
  controller: ReturnType<typeof createFolderController>,
) {
  const router = Router();

  router.post("/folders", controller.createFolder);
  router.get("/folders", controller.listFolders);
  router.get("/folders/:id", controller.getFolder);
  router.post("/folders/:id/memes", controller.addMeme);
  router.delete("/folders/:id/memes/:memeId", controller.removeMeme);
  router.patch("/folders/:id", controller.renameFolder);
  router.delete("/folders/:id", controller.deleteFolder);

  return router;
}

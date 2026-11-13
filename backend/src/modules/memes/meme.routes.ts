import { Router } from "express";
import type { createMemeController } from "./meme.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { uploadImageFile } from "../../middleware/uploadImageFile.js";
import type { ReadUserId } from "../../types/dependencies.js";

export function createMemeRouter(
  controller: ReturnType<typeof createMemeController>,
  readUserId: ReadUserId,
) {
  const router = Router();

  router.get("/memes", controller.listMemes);
  router.get("/memes/:id", controller.getMeme);
  router.patch("/memes/:id", controller.updateMeme);
  router.delete("/memes/:id", controller.deleteMeme);
  router.post("/memes/:id/like", controller.addLike);
  router.delete("/memes/:id/like", controller.removeLike);
  router.post("/memes", requireAuth(readUserId), uploadImageFile, controller.createMeme);

  return router;
}

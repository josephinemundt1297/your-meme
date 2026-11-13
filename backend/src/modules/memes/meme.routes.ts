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
  const authenticated = requireAuth(readUserId);

  router.get("/memes", controller.listMemes);
  router.get("/memes/:id", controller.getMeme);
  router.patch("/memes/:id", authenticated, controller.updateMeme);
  router.delete("/memes/:id", authenticated, controller.deleteMeme);
  router.post("/memes/:id/like", authenticated, controller.addLike);
  router.delete("/memes/:id/like", authenticated, controller.removeLike);
  router.post("/memes", authenticated, uploadImageFile, controller.createMeme);

  return router;
}

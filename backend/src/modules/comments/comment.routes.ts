import { requireAuth } from "../../middleware/requireAuth.js";
import type { ReadUserId } from "../../types/dependencies.js";
import { Router } from "express";
import type { createCommentController } from "./comment.controller.js";

export function createCommentRouter(
  controller: ReturnType<typeof createCommentController>,
  readUserId: ReadUserId,
) {
  const router = Router();
  const authenticated = requireAuth(readUserId);

  router.get("/memes/:id/comments", controller.listComments);
  router.post("/memes/:id/comments", authenticated, controller.createComment);
  router.patch("/comments/:id", authenticated, controller.updateComment);
  router.delete("/comments/:id", authenticated, controller.deleteComment);

  return router;
}

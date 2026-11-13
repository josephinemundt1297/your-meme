import { Router } from "express";
import type { createCommentController } from "./comment.controller.js";

export function createCommentRouter(
  controller: ReturnType<typeof createCommentController>,
) {
  const router = Router();

  router.get("/memes/:id/comments", controller.listComments);
  router.post("/memes/:id/comments", controller.createComment);
  router.patch("/comments/:id", controller.updateComment);
  router.delete("/comments/:id", controller.deleteComment);

  return router;
}

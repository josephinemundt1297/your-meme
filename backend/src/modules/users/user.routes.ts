import { requireAuth } from "../../middleware/requireAuth.js";
import type { ReadUserId } from "../../types/dependencies.js";
import { Router } from "express";
import type { createUserController } from "./user.controller.js";

export function createUserRouter(
  controller: ReturnType<typeof createUserController>,
  readUserId: ReadUserId,
) {
  const router = Router();
  const authenticated = requireAuth(readUserId);

  router.get("/me", authenticated, controller.getCurrentUser);
  router.post("/me/sync", authenticated, controller.syncCurrentUser);

  return router;
}

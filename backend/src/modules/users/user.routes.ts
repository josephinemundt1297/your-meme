import { Router } from "express";
import type { createUserController } from "./user.controller.js";

export function createUserRouter(controller: ReturnType<typeof createUserController>) {
  const router = Router();

  router.get("/me", controller.getCurrentUser);
  router.post("/me/sync", controller.syncCurrentUser);

  return router;
}

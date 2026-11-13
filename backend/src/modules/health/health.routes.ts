import { Router } from "express";
import type { createHealthController } from "./health.controller.js";

export function createHealthRouter(
  controller: ReturnType<typeof createHealthController>,
) {
  const router = Router();
  router.get("/health", controller.getHealth);
  router.get("/health/db", controller.getDatabaseHealth);
  return router;
}

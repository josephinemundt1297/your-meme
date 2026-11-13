import express from "express";
import cors from "cors";
import type { AppDependencies } from "./types/dependencies.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { createRequestLimiter } from "./middleware/requestLimiter.js";
import { createHealthController } from "./modules/health/health.controller.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createUserService } from "./modules/users/user.service.js";
import { createUserController } from "./modules/users/user.controller.js";
import { createUserRouter } from "./modules/users/user.routes.js";
import { createMemeService } from "./modules/memes/meme.service.js";
import { createMemeController } from "./modules/memes/meme.controller.js";
import { createMemeRouter } from "./modules/memes/meme.routes.js";
import { createCommentService } from "./modules/comments/comment.service.js";
import { createCommentController } from "./modules/comments/comment.controller.js";
import { createCommentRouter } from "./modules/comments/comment.routes.js";
import { createFolderService } from "./modules/folders/folder.service.js";
import { createFolderController } from "./modules/folders/folder.controller.js";
import { createFolderRouter } from "./modules/folders/folder.routes.js";

// Die App erhält ihre Dienste von außen und öffnet selbst keinen Port.
export function createApp(dependencies: AppDependencies) {
  const app = express();
  app.use(cors({
    origin: "http://localhost:5173",
    exposedHeaders: ["X-Page", "X-Limit", "X-Has-More", "Retry-After"],
  }));
  const windowMs = 60_000;
  const apiLimit = createRequestLimiter({ maxRequests: 300, windowMs });
  const writeLimit = createRequestLimiter({ maxRequests: 60, windowMs });
  const uploadLimit = createRequestLimiter({ maxRequests: 10, windowMs });

  // Vor Body-Parsing und Clerk begrenzen; fehlerhafte Anfragen zählen ebenfalls.
  app.use("/api", apiLimit);
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    return writeLimit(req, res, next);
  });
  app.post("/api/memes", uploadLimit);
  app.use(express.json());
  app.use(dependencies.authenticate);

  app.use("/api", createHealthRouter(createHealthController(dependencies.database)));
  const userService = createUserService(dependencies);
  const userController = createUserController(userService);
  app.use("/api", createUserRouter(userController, dependencies.readUserId));

  const memeService = createMemeService(dependencies);
  const memeController = createMemeController(memeService, dependencies.readUserId);
  app.use("/api", createMemeRouter(memeController, dependencies.readUserId));

  const commentService = createCommentService(dependencies);
  const commentController = createCommentController(commentService);
  app.use("/api", createCommentRouter(commentController, dependencies.readUserId));

  const folderService = createFolderService(dependencies);
  const folderController = createFolderController(folderService);
  app.use("/api", createFolderRouter(folderController, dependencies.readUserId));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

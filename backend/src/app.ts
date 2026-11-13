import express from "express";
import cors from "cors";
import type { AppDependencies } from "./types/dependencies.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
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
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());
  app.use(dependencies.authenticate);

  app.use("/api", createHealthRouter(createHealthController(dependencies.database)));
  const userService = createUserService(dependencies);
  const userController = createUserController(userService, dependencies.readUserId);
  app.use("/api", createUserRouter(userController));

  const memeService = createMemeService(dependencies);
  const memeController = createMemeController(memeService, dependencies.readUserId);
  app.use("/api", createMemeRouter(memeController, dependencies.readUserId));

  const commentService = createCommentService(dependencies);
  const commentController = createCommentController(commentService, dependencies.readUserId);
  app.use("/api", createCommentRouter(commentController));

  const folderService = createFolderService(dependencies);
  const folderController = createFolderController(folderService, dependencies.readUserId);
  app.use("/api", createFolderRouter(folderController));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

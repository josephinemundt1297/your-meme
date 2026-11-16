import { clerkClient, clerkMiddleware, getAuth } from "@clerk/express";
import type { AppDependencies } from "./types/dependencies.js";
import {
  createImageDeletionService,
  startImageDeletionRetries,
} from "./modules/memes/image-deletion.service.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { cloudinary } from "./lib/cloudinary.js";
import { uploadImage } from "./lib/uploadImage.js";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT muss eine ganze Zahl zwischen 1 und 65535 sein.");
}

const dependencies: AppDependencies = {
  database: prisma,
  imageStorage: {
    upload: uploadImage,
    destroy: (publicId, options) => cloudinary.uploader.destroy(publicId, options),
  },
  getClerkUser: (userId) => clerkClient.users.getUser(userId),
  authenticate: clerkMiddleware(),
  readUserId: (request) => getAuth(request).userId,
};
const app = createApp(dependencies);

const server = app.listen(port, () => {
  const stopRetries = startImageDeletionRetries(
    createImageDeletionService(dependencies),
  );
  server.once("close", stopRetries);
  console.log(`Your-Meme-Backend läuft auf http://localhost:${port}`);
});

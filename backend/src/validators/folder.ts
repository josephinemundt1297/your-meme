import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const addMemeToFolderSchema = z.object({
  memeId: z.uuid(),
});

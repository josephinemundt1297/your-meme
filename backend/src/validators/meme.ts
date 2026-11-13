import { z } from "zod";

export const createMemeSchema = z.object({
  title: z.string().trim().min(1).max(100),

  imageUrl: z.url(),

  imageStorageId: z.string().trim().min(1),
});

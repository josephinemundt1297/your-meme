import { z } from "zod";
import { categorySchema } from "./category.js";

// Bildadresse und Speicher-ID kommen vom Cloudinary-Upload, nicht aus dem Formular.
export const createMemeSchema = z.object({
  title: z.string().trim().min(1).max(100),
  category: categorySchema.default("Ohne Kategorie"),
});

// Beim Bearbeiten nur übermittelte Felder ändern; mindestens eines ist nötig.
export const updateMemeSchema = z
  .object({
    title: createMemeSchema.shape.title.optional(),
    category: categorySchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.category !== undefined);

export type MemeChanges = z.infer<typeof updateMemeSchema>;

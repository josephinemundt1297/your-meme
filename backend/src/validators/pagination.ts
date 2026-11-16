import { z } from "zod";
import { categorySchema } from "./category.js";

// Nur einzelne, positive ganze Zahlen akzeptieren, keine Arrays oder Teilzahlen.
const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().safe().positive());

export const paginationSchema = z.strictObject({
  page: positiveInteger.pipe(z.number().max(10_000)).default(1),
  limit: positiveInteger.pipe(z.number().max(100)).default(50),
});

export const memeListQuerySchema = paginationSchema.extend({
  category: categorySchema.optional(),
});

export type MemeListQuery = z.infer<typeof memeListQuerySchema>;

export type Pagination = z.infer<typeof paginationSchema>;

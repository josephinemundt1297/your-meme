import { z } from "zod";

export const createMemeSchema = z.object({
  title: z.string().trim().min(1).max(100),

  imageUrl: z.url(),

  imageStorageId: z.string().trim().min(1),
});
const testMeme = {
  title: "   ",
  imageUrl: "keine-gueltige-url",
  imageStorageId: "",
};

const result = createMemeSchema.safeParse(testMeme);

if (!result.success) {
  console.log(z.treeifyError(result.error));
}

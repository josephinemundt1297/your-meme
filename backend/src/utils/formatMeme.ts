import { Prisma } from "../generated/prisma/client.js";
import { memeSelect } from "../lib/memeSelect.js";

type MemeWithCount = Prisma.MemeGetPayload<{
  select: typeof memeSelect;
}>;

export function formatMeme(meme: MemeWithCount) {
  const { _count, ...memeData } = meme;

  return {
    ...memeData,
    likeCount: _count.likes,
  };
}

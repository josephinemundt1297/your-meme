import { Prisma } from "../generated/prisma/client.js";
import { memeSelect } from "../lib/memeSelect.js";

type MemeWithCount = Prisma.MemeGetPayload<{
  select: typeof memeSelect;
}>;

export function formatMeme(meme: MemeWithCount, likedByMe: boolean) {
  const { _count, user, ...memeData } = meme;

  return {
    ...memeData,
    author: user,
    likeCount: _count.likes,
    commentCount: _count.comments,
    likedByMe,
  };
}

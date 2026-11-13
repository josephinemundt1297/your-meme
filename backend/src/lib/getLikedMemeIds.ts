import type { Database } from "../types/dependencies.js";

export async function getLikedMemeIds(
  prisma: Pick<Database, "like">,
  memeIds: string[],
  clerkUserId: string | null | undefined,
): Promise<Set<string>> {
  if (!clerkUserId || memeIds.length === 0) return new Set();

  const likes = await prisma.like.findMany({
    where: {
      user: { clerkId: clerkUserId },
      memeId: { in: memeIds },
    },
    select: { memeId: true },
  });

  return new Set(likes.map((like) => like.memeId));
}

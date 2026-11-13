import type { AppDependencies } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { memeSelect } from "../../lib/memeSelect.js";
import { getLikedMemeIds } from "../../lib/getLikedMemeIds.js";
import { formatMeme } from "../../utils/formatMeme.js";
import type { Pagination } from "../../validators/pagination.js";

export function createMemeService(
  dependencies: Pick<AppDependencies, "database" | "imageStorage">,
) {
  const prisma = dependencies.database;
  const imageStorage = dependencies.imageStorage;

  async function listMemes(
    clerkUserId: string | null | undefined,
    pagination: Pagination,
  ) {
    const rows = await prisma.meme.findMany({
      select: memeSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit + 1,
    });

    const memes = rows.slice(0, pagination.limit);

    const likedMemeIds = await getLikedMemeIds(
      prisma,
      memes.map((meme) => meme.id),
      clerkUserId,
    );

    return {
      memes: memes.map((meme) => formatMeme(meme, likedMemeIds.has(meme.id))),
      hasMore: rows.length > pagination.limit,
    };
  }

  async function getMeme(id: string, clerkUserId: string | null | undefined) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: memeSelect,
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    const ownLike = clerkUserId
      ? await prisma.like.findFirst({
          where: {
            memeId: id,
            user: {
              clerkId: clerkUserId,
            },
          },
          select: {
            memeId: true,
          },
        })
      : null;

    return formatMeme(meme, ownLike !== null);
  }

  async function updateMeme(id: string, clerkUserId: string, title: string) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: {
        userId: true,
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    if (meme.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Memes bearbeiten.");
    }

    const updatedMeme = await prisma.meme.update({
      where: { id, userId: meme.userId },
      data: {
        title,
      },
      select: memeSelect,
    });

    const likedMemeIds = await getLikedMemeIds(prisma, [id], clerkUserId);
    return formatMeme(updatedMeme, likedMemeIds.has(id));
  }

  async function deleteMeme(id: string, clerkUserId: string) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: {
        userId: true,
        imageStorageId: true,
        user: {
          select: {
            clerkId: true,
          },
        },
      },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    const requestingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { role: true },
    });

    if (meme.user.clerkId !== clerkUserId && requestingUser?.role !== "ADMIN") {
      throw new HttpError(403, "Du darfst nur eigene Memes löschen.");
    }

    const imageResult = await imageStorage.destroy(meme.imageStorageId, {
      resource_type: "image",
      invalidate: true,
    });

    if (imageResult.result !== "ok" && imageResult.result !== "not found") {
      throw new Error("Bild konnte nicht gelöscht werden.");
    }

    await prisma.meme.delete({
      where: {
        id,
        userId: meme.userId,
      },
    });
  }

  async function addLike(id: string, clerkUserId: string) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(409, "Bitte zuerst dein Nutzerprofil synchronisieren.");
    }

    await prisma.like.createMany({
      data: {
        userId: user.id,
        memeId: id,
      },
      skipDuplicates: true,
    });

    const likeCount = await prisma.like.count({
      where: { memeId: id },
    });

    return {
      memeId: id,
      liked: true,
      likeCount,
    };
  }

  async function removeLike(id: string, clerkUserId: string) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(409, "Bitte zuerst dein Nutzerprofil synchronisieren.");
    }

    await prisma.like.deleteMany({
      where: {
        userId: user.id,
        memeId: id,
      },
    });

    const likeCount = await prisma.like.count({
      where: { memeId: id },
    });

    return {
      memeId: id,
      liked: false,
      likeCount,
    };
  }

  async function createMeme(clerkUserId: string, title: string, buffer: Buffer) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(409, "Bitte zuerst dein Nutzerprofil synchronisieren.");
    }

    const image = await imageStorage.upload(buffer);

    const meme = await prisma.meme
      .create({
        data: {
          title,
          imageUrl: image.imageUrl,
          imageStorageId: image.imageStorageId,
          userId: user.id,
        },
        select: memeSelect,
      })
      .catch(async (databaseError) => {
        // Bei fehlgeschlagener Speicherung das neue Bild bereinigen.
        try {
          const cleanup = await imageStorage.destroy(image.imageStorageId);

          if (cleanup.result !== "ok" && cleanup.result !== "not found") {
            throw new Error("Bild konnte nicht entfernt werden.");
          }
        } catch {
          console.error(
            "Cloudinary-Bereinigung fehlgeschlagen. Public ID:",
            image.imageStorageId,
          );
        }

        throw databaseError;
      });

    const likedMemeIds = await getLikedMemeIds(prisma, [meme.id], clerkUserId);
    return formatMeme(meme, likedMemeIds.has(meme.id));
  }

  return {
    listMemes,
    getMeme,
    updateMeme,
    deleteMeme,
    addLike,
    removeLike,
    createMeme,
  };
}

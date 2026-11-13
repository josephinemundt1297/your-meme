import type { AppDependencies } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { memeSelect } from "../../lib/memeSelect.js";
import { formatMeme } from "../../utils/formatMeme.js";

export function createMemeService(
  dependencies: Pick<AppDependencies, "database" | "imageStorage">,
) {
  const prisma = dependencies.database;
  const imageStorage = dependencies.imageStorage;

  async function listMemes(clerkUserId: string | null | undefined) {
    const memes = await prisma.meme.findMany({
      select: memeSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    const ownLikes =
      clerkUserId && memes.length > 0
        ? await prisma.like.findMany({
            where: {
              user: {
                clerkId: clerkUserId,
              },
              memeId: {
                in: memes.map((meme) => meme.id),
              },
            },
            select: {
              memeId: true,
            },
          })
        : [];

    const likedMemeIds = new Set(ownLikes.map((like) => like.memeId));

    return memes.map((meme) => ({
      ...formatMeme(meme),
      likedByMe: likedMemeIds.has(meme.id),
    }));
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

    return {
      ...formatMeme(meme),
      likedByMe: ownLike !== null,
    };
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

    return formatMeme(updatedMeme);
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

    return formatMeme(meme);
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

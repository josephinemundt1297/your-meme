import type { AppDependencies } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { memeSelect } from "../../lib/memeSelect.js";
import { getLikedMemeIds } from "../../lib/getLikedMemeIds.js";
import { formatMeme } from "../../utils/formatMeme.js";
import type { MemeListQuery } from "../../validators/pagination.js";
import type { Category } from "../../validators/category.js";
import { createImageDeletionService } from "./image-deletion.service.js";
import type { MemeChanges } from "../../validators/meme.js";

export function createMemeService(
  dependencies: Pick<AppDependencies, "database" | "imageStorage">,
) {
  const prisma = dependencies.database;
  const imageStorage = dependencies.imageStorage;
  const imageDeletion = createImageDeletionService(dependencies);

  async function listMemes(
    clerkUserId: string | null | undefined,
    pagination: MemeListQuery,
  ) {
    const rows = await prisma.meme.findMany({
      ...(pagination.category ? { where: { category: pagination.category } } : {}),
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

  async function updateMeme(id: string, clerkUserId: string, changes: MemeChanges) {
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
      data: changes,
      select: memeSelect,
    });

    const likedMemeIds = await getLikedMemeIds(prisma, [id], clerkUserId);
    return formatMeme(updatedMeme, likedMemeIds.has(id));
  }

  async function deleteMeme(id: string, clerkUserId: string) {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { userId: true, imageStorageId: true },
    });
    const pending = meme ? null : await prisma.memeImageDeletion.findUnique({ where: { memeId: id } });
    if (!meme && !pending) throw new HttpError(404, "Meme nicht gefunden.");

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }, select: { id: true, role: true },
    });
    const ownerId = meme?.userId ?? pending!.ownerId;
    if (user?.id !== ownerId && user?.role !== "ADMIN") {
      throw new HttpError(403, "Du darfst nur eigene Memes löschen.");
    }

    if (meme) {
      // Auftrag und Inhaltslöschung sind atomar; Cloudinary erst nach dem Commit.
      await prisma.$transaction(async (tx) => {
        await tx.memeImageDeletion.upsert({
          where: { memeId: id }, update: {},
          create: { memeId: id, ownerId, imageStorageId: meme.imageStorageId },
        });
        await tx.meme.delete({ where: { id, userId: ownerId } });
      });
    }
    if (!(await imageDeletion.finish(id))) {
      throw new HttpError(503, "Meme entfernt; die Bildbereinigung ist noch offen und wird erneut versucht.");
    }
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

  async function createMeme(
    clerkUserId: string, title: string, buffer: Buffer, category: Category,
  ) {
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
          category,
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
          console.error("Cloudinary-Bereinigung nach Upload fehlgeschlagen.");
        }

        throw databaseError;
      });

    return formatMeme(meme, false);
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

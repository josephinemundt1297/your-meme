import type { AppDependencies } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { memeSelect } from "../../lib/memeSelect.js";
import { getLikedMemeIds } from "../../lib/getLikedMemeIds.js";
import { formatMeme } from "../../utils/formatMeme.js";

export function createFolderService(dependencies: Pick<AppDependencies, "database">) {
  const prisma = dependencies.database;

  async function createFolder(clerkUserId: string, name: string) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(409, "Bitte zuerst dein Nutzerprofil synchronisieren.");
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return folder;
  }

  async function listFolders(clerkUserId: string) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      throw new HttpError(409, "Bitte zuerst dein Nutzerprofil synchronisieren.");
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return folders;
  }

  async function getFolder(id: string, clerkUserId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: {
          select: { clerkId: true },
        },
        folderMemes: {
          select: {
            meme: {
              select: memeSelect,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!folder) {
      throw new HttpError(404, "Ordner nicht gefunden.");
    }

    if (folder.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Ordner ansehen.");
    }

    const likedMemeIds = await getLikedMemeIds(
      prisma,
      folder.folderMemes.map((entry) => entry.meme.id),
      clerkUserId,
    );

    return {
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      memes: folder.folderMemes.map((entry) =>
        formatMeme(entry.meme, likedMemeIds.has(entry.meme.id)),
      ),
    };
  }

  async function addMeme(id: string, clerkUserId: string, memeId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      throw new HttpError(404, "Ordner nicht gefunden.");
    }

    if (folder.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Ordner ändern.");
    }

    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      select: { id: true },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    await prisma.folderMeme.createMany({
      data: {
        folderId: id,
        memeId: meme.id,
      },
      skipDuplicates: true,
    });

    return {
      folderId: id,
      memeId: meme.id,
      saved: true,
    };
  }

  async function removeMeme(id: string, memeId: string, clerkUserId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      throw new HttpError(404, "Ordner nicht gefunden.");
    }

    if (folder.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Ordner ändern.");
    }

    await prisma.folderMeme.deleteMany({
      where: {
        folderId: id,
        memeId,
      },
    });

    return {
      folderId: id,
      memeId,
      saved: false,
    };
  }

  async function renameFolder(id: string, clerkUserId: string, name: string) {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        userId: true,
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      throw new HttpError(404, "Ordner nicht gefunden.");
    }

    if (folder.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Ordner ändern.");
    }

    const updatedFolder = await prisma.folder.update({
      where: {
        id,
        userId: folder.userId,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return updatedFolder;
  }

  async function deleteFolder(id: string, clerkUserId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        userId: true,
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      throw new HttpError(404, "Ordner nicht gefunden.");
    }

    if (folder.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Ordner löschen.");
    }

    await prisma.folder.delete({
      where: {
        id,
        userId: folder.userId,
      },
    });
  }

  return {
    createFolder,
    listFolders,
    getFolder,
    addMeme,
    removeMeme,
    renameFolder,
    deleteFolder,
  };
}

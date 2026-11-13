import type { AppDependencies } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";

export function createCommentService(dependencies: Pick<AppDependencies, "database">) {
  const prisma = dependencies.database;

  async function listComments(id: string) {
    // Zuerst prüfen, ob das Meme existiert.
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      throw new HttpError(404, "Meme nicht gefunden.");
    }

    // Erst danach die Kommentare laden.
    const comments = await prisma.comment.findMany({
      where: {
        memeId: id,
      },
      select: {
        id: true,
        content: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return comments;
  }

  async function createComment(id: string, clerkUserId: string, content: string) {
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

    const comment = await prisma.comment.create({
      data: {
        content,
        memeId: id,
        userId: user.id,
      },
      select: {
        id: true,
        content: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return comment;
  }

  async function updateComment(id: string, clerkUserId: string, content: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        userId: true,
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!comment) {
      throw new HttpError(404, "Kommentar nicht gefunden.");
    }

    if (comment.user.clerkId !== clerkUserId) {
      throw new HttpError(403, "Du darfst nur eigene Kommentare bearbeiten.");
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id,
        userId: comment.userId,
      },
      data: {
        content,
      },
      select: {
        id: true,
        content: true,
        userId: true,
        createdAt: true,
        user: {
          select: { username: true },
        },
      },
    });

    return updatedComment;
  }

  async function deleteComment(id: string, clerkUserId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        userId: true,
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!comment) {
      throw new HttpError(404, "Kommentar nicht gefunden.");
    }

    const requestingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { role: true },
    });

    if (comment.user.clerkId !== clerkUserId && requestingUser?.role !== "ADMIN") {
      throw new HttpError(403, "Du darfst nur eigene Kommentare löschen.");
    }

    await prisma.comment.delete({
      where: {
        id,
        userId: comment.userId,
      },
    });
  }

  return { listComments, createComment, updateComment, deleteComment };
}

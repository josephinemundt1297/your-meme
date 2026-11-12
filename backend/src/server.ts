import express from "express";
import { prisma } from "./lib/prisma.js";
import { createMemeSchema } from "./validators/meme.js";
import { isValidUuid } from "./utils/isValidUuid.js";
import { memeSelect } from "./lib/memeSelect.js";
import { formatMeme } from "./utils/formatMeme.js";
import cors from "cors";
import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import multer from "multer";
import { upload } from "./middleware/upload.js";
import { isPng } from "./utils/isPng.js";
import { uploadImage } from "./lib/uploadImage.js";
import { cloudinary } from "./lib/cloudinary.js";
import { createCommentSchema } from "./validators/comment.js";
import type { ErrorRequestHandler } from "express";
import {
  createFolderSchema,
  addMemeToFolderSchema,
} from "./validators/folder.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());
app.use(clerkMiddleware());
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT muss eine ganze Zahl zwischen 1 und 65535 sein.");
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Prüft, ob PostgreSQL erreichbar ist.
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Datenbankfehler:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.get("/api/me", (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  return res.json({
    clerkId: userId,
  });
});

app.post("/api/me/sync", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    const username = clerkUser.username ?? clerkUser.firstName ?? "MemeFan";

    const user = await prisma.user.upsert({
      where: {
        clerkId: userId,
      },
      update: {
        username,
      },
      create: {
        clerkId: userId,
        username,
      },
      select: {
        id: true,
        clerkId: true,
        username: true,
        role: true,
      },
    });

    return res.json(user);
  } catch (error) {
    console.error("Fehler beim Abgleichen des Nutzerprofils:", error);

    return res.status(500).json({
      error: "Nutzerprofil konnte nicht abgeglichen werden.",
    });
  }
});

app.get("/api/memes", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const memes = await prisma.meme.findMany({
      select: memeSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    const ownLikes =
      userId && memes.length > 0
        ? await prisma.like.findMany({
            where: {
              user: {
                clerkId: userId,
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

    return res.json(
      memes.map((meme) => ({
        ...formatMeme(meme),
        likedByMe: likedMemeIds.has(meme.id),
      })),
    );
  } catch (error) {
    console.error("Fehler beim Laden der Memes:", error);

    return res.status(500).json({
      error: "Memes konnten nicht geladen werden.",
    });
  }
});

app.get("/api/memes/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
    const { userId } = getAuth(req);

    const meme = await prisma.meme.findUnique({
      where: { id },
      select: memeSelect,
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    const ownLike = userId
      ? await prisma.like.findFirst({
          where: {
            memeId: id,
            user: {
              clerkId: userId,
            },
          },
          select: {
            memeId: true,
          },
        })
      : null;

    return res.json({
      ...formatMeme(meme),
      likedByMe: ownLike !== null,
    });
  } catch (error) {
    console.error("Fehler beim Laden des Memes:", error);

    return res.status(500).json({
      error: "Meme konnte nicht geladen werden.",
    });
  }
});

app.patch("/api/memes/:id", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  const result = createMemeSchema.pick({ title: true }).safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Bitte einen Titel mit 1 bis 100 Zeichen angeben.",
    });
  }

  try {
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
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    if (meme.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Memes bearbeiten.",
      });
    }

    const updatedMeme = await prisma.meme.update({
      where: { id, userId: meme.userId },
      data: {
        title: result.data.title,
      },
      select: memeSelect,
    });

    return res.json(formatMeme(updatedMeme));
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Memes:", error);

    return res.status(500).json({
      error: "Meme konnte nicht bearbeitet werden.",
    });
  }
});

// Lädt alle Kommentare zu einem bestimmten Meme.
app.get("/api/memes/:id/comments", async (req, res) => {
  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
    // Zuerst prüfen, ob das Meme existiert.
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
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

    res.json(comments);
  } catch (error) {
    console.error("Fehler beim Laden der Kommentare:", error);

    res.status(500).json({
      error: "Kommentare konnten nicht geladen werden.",
    });
  }
});

app.post("/api/memes/:id/comments", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  const result = createCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Bitte einen Kommentar mit 1 bis 1000 Zeichen angeben.",
    });
  }

  try {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(409).json({
        error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: result.data.content,
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

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Fehler beim Speichern des Kommentars:", error);

    return res.status(500).json({
      error: "Kommentar konnte nicht gespeichert werden.",
    });
  }
});

app.post(
  "/api/memes",

  // Anmeldung prüfen, bevor eine Datei angenommen wird.
  (req, res, next) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    next();
  },

  // Genau eine Datei im Formularfeld "image" annehmen.
  (req, res, next) => {
    upload.single("image")(req, res, (error: unknown) => {
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          error: "Das Bild darf höchstens 5 MB groß sein.",
        });
      }

      if (error) {
        return res.status(400).json({
          error: "Bitte genau ein JPNG-Bild im Feld image senden.",
        });
      }

      next();
    });
  },

  // Titel und Dateisignatur prüfen.
  async (req, res) => {
    const result = createMemeSchema.pick({ title: true }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Bitte einen Titel mit 1 bis 100 Zeichen angeben.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Bitte ein Bild auswählen.",
      });
    }

    if (!(await isPng(req.file.buffer))) {
      return res.status(400).json({
        error: "Die Datei wurde nicht als PNG erkannt.",
      });
    }

    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        return res.status(409).json({
          error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
        });
      }

      const image = await uploadImage(req.file.buffer);

      const meme = await prisma.meme
        .create({
          data: {
            title: result.data.title,
            imageUrl: image.imageUrl,
            imageStorageId: image.imageStorageId,
            userId: user.id,
          },
          select: memeSelect,
        })
        .catch(async (databaseError) => {
          // Bei fehlgeschlagener Speicherung das neue Bild bereinigen.
          try {
            const cleanup = await cloudinary.uploader.destroy(
              image.imageStorageId,
            );

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

      return res.status(201).json(formatMeme(meme));
    } catch (error) {
      console.error("Fehler beim Erstellen des Memes:", error);

      return res.status(500).json({
        error: "Meme konnte nicht gespeichert werden.",
      });
    }
  },
);
app.delete("/api/memes/:id", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
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
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    if (meme.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Memes löschen.",
      });
    }

    const imageResult = await cloudinary.uploader.destroy(meme.imageStorageId, {
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

    return res.status(204).send();
  } catch (error) {
    console.error("Fehler beim Löschen des Memes:", error);

    return res.status(500).json({
      error: "Meme konnte nicht gelöscht werden.",
    });
  }
});

app.patch("/api/comments/:id", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Kommentar-ID.",
    });
  }

  const result = createCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Bitte einen Kommentar mit 1 bis 1000 Zeichen angeben.",
    });
  }

  try {
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
      return res.status(404).json({
        error: "Kommentar nicht gefunden.",
      });
    }

    if (comment.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Kommentare bearbeiten.",
      });
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id,
        userId: comment.userId,
      },
      data: {
        content: result.data.content,
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

    return res.json(updatedComment);
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Kommentars:", error);

    return res.status(500).json({
      error: "Kommentar konnte nicht bearbeitet werden.",
    });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Kommentar-ID.",
    });
  }

  try {
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
      return res.status(404).json({
        error: "Kommentar nicht gefunden.",
      });
    }

    if (comment.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Kommentare löschen.",
      });
    }

    await prisma.comment.delete({
      where: {
        id,
        userId: comment.userId,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Fehler beim Löschen des Kommentars:", error);

    return res.status(500).json({
      error: "Kommentar konnte nicht gelöscht werden.",
    });
  }
});

app.post("/api/memes/:id/like", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(409).json({
        error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
      });
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

    return res.status(200).json({
      memeId: id,
      liked: true,
      likeCount,
    });
  } catch (error) {
    console.error("Fehler beim Liken des Memes:", error);

    return res.status(500).json({
      error: "Like konnte nicht gespeichert werden.",
    });
  }
});

app.delete("/api/memes/:id/like", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(409).json({
        error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
      });
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

    return res.json({
      memeId: id,
      liked: false,
      likeCount,
    });
  } catch (error) {
    console.error("Fehler beim Entfernen des Likes:", error);

    return res.status(500).json({
      error: "Like konnte nicht entfernt werden.",
    });
  }
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const errorType =
    typeof error === "object" && error !== null && "type" in error
      ? error.type
      : undefined;

  if (errorType === "entity.parse.failed") {
    return res.status(400).json({
      error: "Ungültiges JSON. Bitte den Anfrageinhalt prüfen.",
    });
  }

  if (errorType === "entity.too.large") {
    return res.status(413).json({
      error: "Der Anfrageinhalt ist zu groß.",
    });
  }

  console.error("Unerwarteter Serverfehler.");

  return res.status(500).json({
    error: "Ein interner Serverfehler ist aufgetreten.",
  });
};

app.post("/api/folders", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const result = createFolderSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Bitte einen Ordnernamen mit 1 bis 100 Zeichen angeben.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(409).json({
        error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
      });
    }

    const folder = await prisma.folder.create({
      data: {
        name: result.data.name,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return res.status(201).json(folder);
  } catch (error) {
    console.error("Fehler beim Erstellen des Ordners:", error);

    return res.status(500).json({
      error: "Ordner konnte nicht erstellt werden.",
    });
  }
});

app.get("/api/folders", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(409).json({
        error: "Bitte zuerst dein Nutzerprofil synchronisieren.",
      });
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

    return res.json(folders);
  } catch (error) {
    console.error("Fehler beim Laden der Ordner:", error);

    return res.status(500).json({
      error: "Ordner konnten nicht geladen werden.",
    });
  }
});

app.get("/api/folders/:id", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Ordner-ID.",
    });
  }

  try {
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
      return res.status(404).json({
        error: "Ordner nicht gefunden.",
      });
    }

    if (folder.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Ordner ansehen.",
      });
    }

    return res.json({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      memes: folder.folderMemes.map((entry) => formatMeme(entry.meme)),
    });
  } catch (error) {
    console.error("Fehler beim Laden des Ordners:", error);

    return res.status(500).json({
      error: "Ordner konnte nicht geladen werden.",
    });
  }
});

app.post("/api/folders/:id/memes", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Ordner-ID.",
    });
  }

  const result = addMemeToFolderSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Bitte eine gültige Meme-ID angeben.",
    });
  }

  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({
        error: "Ordner nicht gefunden.",
      });
    }

    if (folder.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Ordner ändern.",
      });
    }

    const meme = await prisma.meme.findUnique({
      where: { id: result.data.memeId },
      select: { id: true },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    await prisma.folderMeme.createMany({
      data: {
        folderId: id,
        memeId: meme.id,
      },
      skipDuplicates: true,
    });

    return res.status(200).json({
      folderId: id,
      memeId: meme.id,
      saved: true,
    });
  } catch (error) {
    console.error("Fehler beim Speichern im Ordner:", error);

    return res.status(500).json({
      error: "Meme konnte nicht im Ordner gespeichert werden.",
    });
  }
});

app.delete("/api/folders/:id/memes/:memeId", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Bitte zuerst anmelden.",
    });
  }

  const { id, memeId } = req.params;

  if (!id || !isValidUuid(id)) {
    return res.status(400).json({
      error: "Ungültige Ordner-ID.",
    });
  }

  if (!memeId || !isValidUuid(memeId)) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }

  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        user: {
          select: { clerkId: true },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({
        error: "Ordner nicht gefunden.",
      });
    }

    if (folder.user.clerkId !== userId) {
      return res.status(403).json({
        error: "Du darfst nur eigene Ordner ändern.",
      });
    }

    await prisma.folderMeme.deleteMany({
      where: {
        folderId: id,
        memeId,
      },
    });

    return res.json({
      folderId: id,
      memeId,
      saved: false,
    });
  } catch (error) {
    console.error("Fehler beim Entfernen aus dem Ordner:", error);

    return res.status(500).json({
      error: "Meme konnte nicht aus dem Ordner entfernt werden.",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    error: "Route nicht gefunden.",
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Your-Meme-Backend läuft auf http://localhost:${port}`);
});

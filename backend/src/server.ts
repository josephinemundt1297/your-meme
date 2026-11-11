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

app.get("/api/memes", async (_req, res) => {
  try {
    const memes = await prisma.meme.findMany({
      select: memeSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(memes.map(formatMeme));
  } catch (error) {
    console.error("Fehler beim Laden der Memes:", error);

    res.status(500).json({
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
    const meme = await prisma.meme.findUnique({
      where: { id },
      select: memeSelect,
    });
    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    res.json(formatMeme(meme));
  } catch (error) {
    console.error("Fehler beim Laden des Memes:", error);

    res.status(500).json({
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
app.use((_req, res) => {
  res.status(404).json({
    error: "Route nicht gefunden.",
  });
});

app.listen(port, () => {
  console.log(`Your-Meme-Backend läuft auf http://localhost:${port}`);
});

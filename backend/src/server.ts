import express from "express";
import { prisma } from "./lib/prisma.js";
import { createMemeSchema } from "./validators/meme.js";

const app = express();
app.use(express.json());
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

app.get("/api/memes", async (_req, res) => {
  try {
    const memes = await prisma.meme.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(memes);
  } catch (error) {
    console.error("Fehler beim Laden der Memes:", error);

    res.status(500).json({
      error: "Memes konnten nicht geladen werden.",
    });
  }
});

app.get("/api/memes/:id", async (req, res) => {
  const { id } = req.params;

  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return res.status(400).json({
      error: "Ungültige Meme-ID.",
    });
  }
  try {
    const meme = await prisma.meme.findUnique({
      where: {
        id,
      },
    });

    if (!meme) {
      return res.status(404).json({
        error: "Meme nicht gefunden.",
      });
    }

    res.json(meme);
  } catch (error) {
    console.error("Fehler beim Laden des Memes:", error);

    res.status(500).json({
      error: "Meme konnte nicht geladen werden.",
    });
  }
});
app.post("/api/memes", (req, res) => {
  const result = createMemeSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Ungültige Meme-Daten.",
    });
  }

  return res.status(503).json({
    error: "Meme-Erstellung ist noch nicht verfügbar.",
  });
});
app.delete("/api/memes/:id", (_req, res) => {
  return res.status(503).json({
    error: "Meme-Löschung ist noch nicht verfügbar.",
  });
});
app.use((_req, res) => {
  res.status(404).json({ error: "Route nicht gefunden." });
});

app.listen(port, () => {
  console.log(`Your-Meme-Backend läuft auf http://localhost:${port}`);
});

import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma.js";

type TestMeme = {
  id: string;
  title: string;
  imageUrl: string;
  imageStorageId: string;
  createdAt: string;
  updatedAt: string;
};

async function main() {
  const content = await readFile(new URL("./test-memes.json", import.meta.url), "utf8");
  const memes = JSON.parse(content) as TestMeme[];

  if (!Array.isArray(memes) || memes.length === 0) {
    throw new Error("Die Testdaten sind leer oder ungültig.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Eigenes Demo-Profil; keine echten Clerk-Konten übernehmen.
    const user = await tx.user.upsert({
      where: { clerkId: "seed:your-meme:bilddaten" },
      update: {},
      create: {
        clerkId: "seed:your-meme:bilddaten",
        username: "Meme-Testdaten",
      },
    });

    return tx.meme.createMany({
      data: memes.map((meme) => ({
        id: meme.id,
        title: meme.title,
        imageUrl: meme.imageUrl,
        imageStorageId: meme.imageStorageId,
        createdAt: new Date(meme.createdAt),
        updatedAt: new Date(meme.updatedAt),
        userId: user.id,
      })),
      skipDuplicates: true,
    });
  });

  console.log(`${result.count} Test-Memes neu eingefügt.`);
  console.log("Bereits vorhandene Meme-IDs wurden übersprungen.");
}

main()
  .catch(() => {
    console.error("Import fehlgeschlagen. Datenbankverbindung und Testdaten prüfen.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

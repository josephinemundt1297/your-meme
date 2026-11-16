import type { ApiHandler, ReadUserId } from "../../types/dependencies.js";
import { handleRequest } from "../../middleware/handleRequest.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createMemeService } from "./meme.service.js";
import { createMemeSchema, updateMemeSchema } from "../../validators/meme.js";
import { isPng } from "../../utils/isPng.js";
import { memeListQuerySchema } from "../../validators/pagination.js";

export function createMemeController(
  service: ReturnType<typeof createMemeService>,
  readUserId: ReadUserId,
) {
  const listMemes: ApiHandler = handleRequest(
    async (req, res) => {
      const listQuery = memeListQuerySchema.safeParse(req.query);
      if (!listQuery.success) {
        return res.status(400).json({
          error: "page muss zwischen 1 und 10000, limit zwischen 1 und 100 liegen; category muss eine bekannte Kategorie sein.",
        });
      }
      const clerkUserId = readUserId(req);
      const response = await service.listMemes(clerkUserId, listQuery.data);
      res.setHeader("X-Page", String(listQuery.data.page));
      res.setHeader("X-Limit", String(listQuery.data.limit));
      res.setHeader("X-Has-More", String(response.hasMore));
      return res.status(200).json(response.memes);
    },
    "Memes konnten nicht geladen werden.",
    "Fehler beim Laden der Memes:",
  );

  const getMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      const clerkUserId = readUserId(req);
      const response = await service.getMeme(id, clerkUserId);
      return res.status(200).json(response);
    },
    "Meme konnte nicht geladen werden.",
    "Fehler beim Laden des Memes:",
  );

  const updateMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      const result = updateMemeSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Bitte einen Titel mit 1 bis 100 Zeichen oder eine bekannte Kategorie angeben.",
        });
      }

      const response = await service.updateMeme(id, clerkUserId, result.data);
      return res.status(200).json(response);
    },
    "Meme konnte nicht bearbeitet werden.",
    "Fehler beim Bearbeiten des Memes:",
  );

  const deleteMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      await service.deleteMeme(id, clerkUserId);
      return res.status(204).send();
    },
    "Meme konnte nicht gelöscht werden.",
    "Fehler beim Löschen des Memes:",
  );

  const addLike: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      const response = await service.addLike(id, clerkUserId);
      return res.status(200).json(response);
    },
    "Like konnte nicht gespeichert werden.",
    "Fehler beim Liken des Memes:",
  );

  const removeLike: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      const response = await service.removeLike(id, clerkUserId);
      return res.status(200).json(response);
    },
    "Like konnte nicht entfernt werden.",
    "Fehler beim Entfernen des Likes:",
  );

  const createMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const result = createMemeSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Bitte einen Titel mit 1 bis 100 Zeichen und eine bekannte Kategorie angeben.",
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

      const clerkUserId = res.locals.clerkUserId;

      const response = await service.createMeme(
        clerkUserId,
        result.data.title,
        req.file.buffer,
        result.data.category,
      );
      return res.status(201).json(response);
    },
    "Meme konnte nicht gespeichert werden.",
    "Fehler beim Erstellen des Memes:",
  );

  return { listMemes, getMeme, updateMeme, deleteMeme, addLike, removeLike, createMeme };
}

import type { ApiHandler, ReadUserId } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createMemeService } from "./meme.service.js";
import { createMemeSchema } from "../../validators/meme.js";
import { isPng } from "../../utils/isPng.js";

export function createMemeController(
  service: ReturnType<typeof createMemeService>,
  readUserId: ReadUserId,
) {
  const listMemes: ApiHandler = async (req, res) => {
    try {
      const userId = readUserId(req);
      const response = await service.listMemes(userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Laden der Memes:", error);

      return res.status(500).json({
        error: "Memes konnten nicht geladen werden.",
      });
    }
  };

  const getMeme: ApiHandler = async (req, res) => {
    const { id } = req.params;

    if (!id || !isValidUuid(id)) {
      return res.status(400).json({
        error: "Ungültige Meme-ID.",
      });
    }

    try {
      const userId = readUserId(req);
      const response = await service.getMeme(id, userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Laden des Memes:", error);

      return res.status(500).json({
        error: "Meme konnte nicht geladen werden.",
      });
    }
  };

  const updateMeme: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.updateMeme(id, userId, result.data.title);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Bearbeiten des Memes:", error);

      return res.status(500).json({
        error: "Meme konnte nicht bearbeitet werden.",
      });
    }
  };

  const deleteMeme: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      await service.deleteMeme(id, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Löschen des Memes:", error);

      return res.status(500).json({
        error: "Meme konnte nicht gelöscht werden.",
      });
    }
  };

  const addLike: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.addLike(id, userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Liken des Memes:", error);

      return res.status(500).json({
        error: "Like konnte nicht gespeichert werden.",
      });
    }
  };

  const removeLike: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.removeLike(id, userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Entfernen des Likes:", error);

      return res.status(500).json({
        error: "Like konnte nicht entfernt werden.",
      });
    }
  };

  const createMeme: ApiHandler = async (req, res) => {
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

    const userId = readUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    try {
      const response = await service.createMeme(userId, result.data.title, req.file.buffer);
      return res.status(201).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Erstellen des Memes:", error);

      return res.status(500).json({
        error: "Meme konnte nicht gespeichert werden.",
      });
    }
  };

  return { listMemes, getMeme, updateMeme, deleteMeme, addLike, removeLike, createMeme };
}

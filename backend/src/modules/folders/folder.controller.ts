import type { ApiHandler, ReadUserId } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createFolderService } from "./folder.service.js";
import { createFolderSchema, addMemeToFolderSchema } from "../../validators/folder.js";

export function createFolderController(
  service: ReturnType<typeof createFolderService>,
  readUserId: ReadUserId,
) {
  const createFolder: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.createFolder(userId, result.data.name);
      return res.status(201).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Erstellen des Ordners:", error);

      return res.status(500).json({
        error: "Ordner konnte nicht erstellt werden.",
      });
    }
  };

  const listFolders: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    try {
      const response = await service.listFolders(userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Laden der Ordner:", error);

      return res.status(500).json({
        error: "Ordner konnten nicht geladen werden.",
      });
    }
  };

  const getFolder: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.getFolder(id, userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Laden des Ordners:", error);

      return res.status(500).json({
        error: "Ordner konnte nicht geladen werden.",
      });
    }
  };

  const addMeme: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.addMeme(id, userId, result.data.memeId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Speichern im Ordner:", error);

      return res.status(500).json({
        error: "Meme konnte nicht im Ordner gespeichert werden.",
      });
    }
  };

  const removeMeme: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.removeMeme(id, memeId, userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Entfernen aus dem Ordner:", error);

      return res.status(500).json({
        error: "Meme konnte nicht aus dem Ordner entfernt werden.",
      });
    }
  };

  const renameFolder: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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

    const result = createFolderSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Bitte einen Ordnernamen mit 1 bis 100 Zeichen angeben.",
      });
    }

    try {
      const response = await service.renameFolder(id, userId, result.data.name);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Umbenennen des Ordners:", error);

      return res.status(500).json({
        error: "Ordner konnte nicht umbenannt werden.",
      });
    }
  };

  const deleteFolder: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      await service.deleteFolder(id, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Löschen des Ordners:", error);

      return res.status(500).json({
        error: "Ordner konnte nicht gelöscht werden.",
      });
    }
  };

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

import type { ApiHandler } from "../../types/dependencies.js";
import { handleRequest } from "../../middleware/handleRequest.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createFolderService } from "./folder.service.js";
import { createFolderSchema, addMemeToFolderSchema } from "../../validators/folder.js";

export function createFolderController(
  service: ReturnType<typeof createFolderService>,
) {
  const createFolder: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const result = createFolderSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Bitte einen Ordnernamen mit 1 bis 100 Zeichen angeben.",
        });
      }

      const response = await service.createFolder(clerkUserId, result.data.name);
      return res.status(201).json(response);
    },
    "Ordner konnte nicht erstellt werden.",
    "Fehler beim Erstellen des Ordners:",
  );

  const listFolders: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const response = await service.listFolders(clerkUserId);
      return res.status(200).json(response);
    },
    "Ordner konnten nicht geladen werden.",
    "Fehler beim Laden der Ordner:",
  );

  const getFolder: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Ordner-ID.",
        });
      }

      const response = await service.getFolder(id, clerkUserId);
      return res.status(200).json(response);
    },
    "Ordner konnte nicht geladen werden.",
    "Fehler beim Laden des Ordners:",
  );

  const addMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

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

      const response = await service.addMeme(id, clerkUserId, result.data.memeId);
      return res.status(200).json(response);
    },
    "Meme konnte nicht im Ordner gespeichert werden.",
    "Fehler beim Speichern im Ordner:",
  );

  const removeMeme: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

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

      const response = await service.removeMeme(id, memeId, clerkUserId);
      return res.status(200).json(response);
    },
    "Meme konnte nicht aus dem Ordner entfernt werden.",
    "Fehler beim Entfernen aus dem Ordner:",
  );

  const renameFolder: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

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

      const response = await service.renameFolder(id, clerkUserId, result.data.name);
      return res.status(200).json(response);
    },
    "Ordner konnte nicht umbenannt werden.",
    "Fehler beim Umbenennen des Ordners:",
  );

  const deleteFolder: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Ordner-ID.",
        });
      }

      await service.deleteFolder(id, clerkUserId);
      return res.status(204).send();
    },
    "Ordner konnte nicht gelöscht werden.",
    "Fehler beim Löschen des Ordners:",
  );

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

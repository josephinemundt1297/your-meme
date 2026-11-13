import type { ApiHandler, ReadUserId } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createCommentService } from "./comment.service.js";
import { createCommentSchema } from "../../validators/comment.js";

export function createCommentController(
  service: ReturnType<typeof createCommentService>,
  readUserId: ReadUserId,
) {
  const listComments: ApiHandler = async (req, res) => {
    const { id } = req.params;

    if (!id || !isValidUuid(id)) {
      return res.status(400).json({
        error: "Ungültige Meme-ID.",
      });
    }

    try {
      const response = await service.listComments(id);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Laden der Kommentare:", error);

      res.status(500).json({
        error: "Kommentare konnten nicht geladen werden.",
      });
    }
  };

  const createComment: ApiHandler = async (req, res) => {
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

    const result = createCommentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Bitte einen Kommentar mit 1 bis 1000 Zeichen angeben.",
      });
    }

    try {
      const response = await service.createComment(id, userId, result.data.content);
      return res.status(201).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Speichern des Kommentars:", error);

      return res.status(500).json({
        error: "Kommentar konnte nicht gespeichert werden.",
      });
    }
  };

  const updateComment: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      const response = await service.updateComment(id, userId, result.data.content);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Bearbeiten des Kommentars:", error);

      return res.status(500).json({
        error: "Kommentar konnte nicht bearbeitet werden.",
      });
    }
  };

  const deleteComment: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

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
      await service.deleteComment(id, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Löschen des Kommentars:", error);

      return res.status(500).json({
        error: "Kommentar konnte nicht gelöscht werden.",
      });
    }
  };

  return { listComments, createComment, updateComment, deleteComment };
}

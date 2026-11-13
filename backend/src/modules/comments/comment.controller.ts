import type { ApiHandler } from "../../types/dependencies.js";
import { handleRequest } from "../../middleware/handleRequest.js";
import { isValidUuid } from "../../utils/isValidUuid.js";
import type { createCommentService } from "./comment.service.js";
import { createCommentSchema } from "../../validators/comment.js";

export function createCommentController(
  service: ReturnType<typeof createCommentService>,
) {
  const listComments: ApiHandler = handleRequest(
    async (req, res) => {
      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Meme-ID.",
        });
      }

      const response = await service.listComments(id);
      return res.status(200).json(response);
    },
    "Kommentare konnten nicht geladen werden.",
    "Fehler beim Laden der Kommentare:",
  );

  const createComment: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

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

      const response = await service.createComment(id, clerkUserId, result.data.content);
      return res.status(201).json(response);
    },
    "Kommentar konnte nicht gespeichert werden.",
    "Fehler beim Speichern des Kommentars:",
  );

  const updateComment: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

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

      const response = await service.updateComment(id, clerkUserId, result.data.content);
      return res.status(200).json(response);
    },
    "Kommentar konnte nicht bearbeitet werden.",
    "Fehler beim Bearbeiten des Kommentars:",
  );

  const deleteComment: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const { id } = req.params;

      if (!id || !isValidUuid(id)) {
        return res.status(400).json({
          error: "Ungültige Kommentar-ID.",
        });
      }

      await service.deleteComment(id, clerkUserId);
      return res.status(204).send();
    },
    "Kommentar konnte nicht gelöscht werden.",
    "Fehler beim Löschen des Kommentars:",
  );

  return { listComments, createComment, updateComment, deleteComment };
}

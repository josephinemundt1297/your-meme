import type { ApiHandler, ReadUserId } from "../../types/dependencies.js";
import { HttpError } from "../../utils/HttpError.js";
import type { createUserService } from "./user.service.js";

export function createUserController(
  service: ReturnType<typeof createUserService>,
  readUserId: ReadUserId,
) {
  const getCurrentUser: ApiHandler = (req, res) => {
    const userId = readUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    return res.json({
      clerkId: userId,
    });
  };

  const syncCurrentUser: ApiHandler = async (req, res) => {
    const userId = readUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Bitte zuerst anmelden.",
      });
    }

    try {
      const response = await service.syncCurrentUser(userId);
      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Fehler beim Abgleichen des Nutzerprofils:", error);

      return res.status(500).json({
        error: "Nutzerprofil konnte nicht abgeglichen werden.",
      });
    }
  };

  return { getCurrentUser, syncCurrentUser };
}

import type { ApiHandler } from "../../types/dependencies.js";
import { handleRequest } from "../../middleware/handleRequest.js";
import type { createUserService } from "./user.service.js";

export function createUserController(
  service: ReturnType<typeof createUserService>,
) {
  const getCurrentUser: ApiHandler = (_req, res) => {
    const clerkUserId = res.locals.clerkUserId;

    return res.json({
      clerkId: clerkUserId,
    });
  };

  const syncCurrentUser: ApiHandler = handleRequest(
    async (req, res) => {
      const clerkUserId = res.locals.clerkUserId;

      const response = await service.syncCurrentUser(clerkUserId);
      return res.status(200).json(response);
    },
    "Nutzerprofil konnte nicht abgeglichen werden.",
    "Fehler beim Abgleichen des Nutzerprofils:",
  );

  return { getCurrentUser, syncCurrentUser };
}

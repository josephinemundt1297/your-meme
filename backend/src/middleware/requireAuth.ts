import type { ApiHandler, ReadUserId } from "../types/dependencies.js";

export function requireAuth(readUserId: ReadUserId): ApiHandler {
  return (req, res, next) => {
    if (!readUserId(req)) {
      return res.status(401).json({ error: "Bitte zuerst anmelden." });
    }
    next();
  };
}

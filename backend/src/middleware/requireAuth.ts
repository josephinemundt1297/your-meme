import type { ApiHandler, ReadUserId } from "../types/dependencies.js";

export function requireAuth(readUserId: ReadUserId): ApiHandler {
  return (req, res, next) => {
    const clerkUserId = readUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Bitte zuerst anmelden." });
    }
    res.locals.clerkUserId = clerkUserId;
    next();
  };
}

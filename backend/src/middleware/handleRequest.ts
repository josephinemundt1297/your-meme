import type { ApiHandler } from "../types/dependencies.js";
import { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../utils/HttpError.js";

export function handleRequest(
  handler: ApiHandler,
  errorMessage: string,
  logMessage: string,
): ApiHandler {
  return async (req, res, next) => {
    try {
      return await handler(req, res, next);
    } catch (error) {
      if (res.headersSent) return next(error);

      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Der Eintrag ist nicht mehr vorhanden." });
        }
        if (error.code === "P2003" || error.code === "P2002") {
          return res.status(409).json({ error: "Die Daten wurden inzwischen geändert. Bitte neu laden." });
        }
      }
      // Keine Request-Inhalte, SQL-Details, Tokens oder externen Fehlermeldungen loggen.
      console.error(logMessage, "UNEXPECTED_ERROR");
      return res.status(500).json({ error: errorMessage });
    }
  };
}

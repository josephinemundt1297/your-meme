import type { ApiHandler } from "../types/dependencies.js";
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

      console.error(logMessage, error);
      return res.status(500).json({ error: errorMessage });
    }
  };
}

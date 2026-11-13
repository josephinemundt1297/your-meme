import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const errorType =
    typeof error === "object" && error !== null && "type" in error
      ? error.type
      : undefined;

  if (errorType === "entity.parse.failed") {
    return res.status(400).json({
      error: "Ungültiges JSON. Bitte den Anfrageinhalt prüfen.",
    });
  }

  if (errorType === "entity.too.large") {
    return res.status(413).json({
      error: "Der Anfrageinhalt ist zu groß.",
    });
  }

  console.error("Unerwarteter Serverfehler.");

  return res.status(500).json({
    error: "Ein interner Serverfehler ist aufgetreten.",
  });
};

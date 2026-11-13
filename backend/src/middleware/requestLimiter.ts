import type { RequestHandler } from "express";

type RequestLimit = { maxRequests: number; windowMs: number };
type ClientWindow = { count: number; resetAt: number };

// Bewusst pro Serverprozess: kein zusätzlicher Dienst für die lokale Anwendung.
export function createRequestLimiter(limit: RequestLimit): RequestHandler {
  const clients = new Map<string, ClientWindow>();
  const maxTrackedClients = 10_000;
  let nextCleanupAt = 0;

  return (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const now = Date.now();
    if (now >= nextCleanupAt) {
      for (const [client, window] of clients) {
        if (window.resetAt <= now) clients.delete(client);
      }
      nextCleanupAt = now + limit.windowMs;
    }

    const client = req.ip ?? req.socket.remoteAddress ?? "unknown";
    let window = clients.get(client);
    if (!window || window.resetAt <= now) {
      if (!window && clients.size >= maxTrackedClients) {
        const retryAfter = Math.max(1, Math.ceil((nextCleanupAt - now) / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(503).json({
          error: "Die Anfragebegrenzung ist ausgelastet. Bitte später erneut versuchen.",
        });
      }
      window = { count: 0, resetAt: now + limit.windowMs };
      clients.set(client, window);
    }

    if (window.count >= limit.maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Zu viele Anfragen. Bitte später erneut versuchen.",
      });
    }

    window.count += 1;
    return next();
  };
}

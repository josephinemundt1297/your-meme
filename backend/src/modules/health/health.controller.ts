import type { ApiHandler, Database } from "../../types/dependencies.js";

export function createHealthController(prisma: Pick<Database, "$queryRaw">) {
  const getHealth: ApiHandler = (_req, res) => {
    res.json({ status: "ok" });
  };
  const getDatabaseHealth: ApiHandler = async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: "ok",
        database: "connected",
      });
    } catch (error) {
      console.error("Datenbankfehler:", error);

      res.status(503).json({
        status: "error",
        database: "disconnected",
      });
    }
  };
  return { getHealth, getDatabaseHealth };
}

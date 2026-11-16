import type { AppDependencies } from "../../types/dependencies.js";

// Gleicher Auftrag ist wiederholbar: Cloudinary akzeptiert auch „not found“.
export function createImageDeletionService(
  { database, imageStorage }: Pick<AppDependencies, "database" | "imageStorage">,
) {
  async function finish(memeId: string): Promise<boolean> {
    const job = await database.memeImageDeletion.findUnique({ where: { memeId } });
    if (!job) return true;
    try {
      const result = await imageStorage.destroy(job.imageStorageId, {
        resource_type: "image", invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") return false;
      // Auch nach paralleler Verarbeitung erfolgreich; keine Daten nach Erfolg behalten.
      await database.memeImageDeletion.deleteMany({ where: { memeId } });
      return true;
    } catch {
      return false;
    }
  }

  async function retryPending() {
    const jobs = await database.memeImageDeletion.findMany({
      where: { nextAttemptAt: { lte: new Date() } },
      orderBy: [{ nextAttemptAt: "asc" }, { memeId: "asc" }], take: 25,
    });
    for (const job of jobs) {
      // Vor externem Aufruf verschieben: Fehler blockieren nicht die übrige Warteschlange.
      await database.memeImageDeletion.updateMany({
        where: { memeId: job.memeId }, data: { nextAttemptAt: new Date(Date.now() + 60_000) },
      });
      if (!(await finish(job.memeId))) {
        console.error("Bildbereinigung weiterhin offen.");
        if (Date.now() - job.createdAt.getTime() > 24 * 60 * 60 * 1000) {
          console.error("Bildbereinigung älter als 24 Stunden: manuelle Prüfung erforderlich.");
        }
      }
    }
  }

  return { finish, retryPending };
}

export function startImageDeletionRetries(service: ReturnType<typeof createImageDeletionService>) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await service.retryPending(); }
    catch { console.error("Bildbereinigung konnte nicht geprüft werden."); }
    finally { running = false; }
  };
  const timer = setInterval(() => { void run(); }, 60_000);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}

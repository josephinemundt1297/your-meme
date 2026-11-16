CREATE TABLE "MemeImageDeletion" (
  "memeId" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "imageStorageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemeImageDeletion_pkey" PRIMARY KEY ("memeId")
);
-- Absichtlich keine Löschkaskade: Bereinigung muss eine spätere Kontolöschung überleben.
CREATE INDEX "MemeImageDeletion_nextAttemptAt_idx" ON "MemeImageDeletion"("nextAttemptAt");

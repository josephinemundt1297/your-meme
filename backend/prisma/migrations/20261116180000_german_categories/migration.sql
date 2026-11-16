BEGIN;

ALTER TABLE "Meme" DROP CONSTRAINT "Meme_category_check";

-- Nur ausdrücklich bestätigte Zuordnungen übernehmen. Keine inhaltlichen Vermutungen.
UPDATE "Meme"
SET "category" = CASE "category"
  WHEN 'Animal' THEN 'Tiere'
  WHEN 'Food' THEN 'Essen'
  WHEN 'Study' THEN 'Lernen'
  WHEN 'Gaming' THEN 'Spiele'
  WHEN 'Meeting' THEN 'Arbeit'
  ELSE 'Ohne Kategorie'
END,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "category" NOT IN ('Ohne Kategorie', 'Arbeit', 'Programmieren', 'Kaffee', 'Tiere', 'Essen', 'Lernen', 'Spiele', 'Zuhause', 'Wochenende');

ALTER TABLE "Meme" ADD CONSTRAINT "Meme_category_check"
CHECK ("category" IN ('Ohne Kategorie', 'Arbeit', 'Programmieren', 'Kaffee', 'Tiere', 'Essen', 'Lernen', 'Spiele', 'Zuhause', 'Wochenende'));

COMMIT;

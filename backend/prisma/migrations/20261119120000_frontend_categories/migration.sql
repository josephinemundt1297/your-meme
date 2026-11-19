BEGIN;

-- Additive Migration: bestehende Migrationen niemals nachtraeglich veraendern.
ALTER TABLE "Meme" DROP CONSTRAINT IF EXISTS "Meme_category_check";

-- Alte Werte bleiben nicht ungueltig in der Datenbank zurueck.
-- Vor Produktiv-Anwendung die Zuordnung "Wochenende" -> "Alltag" bestaetigen.
UPDATE "Meme"
SET "category" = CASE "category"
  WHEN 'Kaffee' THEN 'Getränke'
  WHEN 'Zuhause' THEN 'Alltag'
  WHEN 'Wochenende' THEN 'Alltag'
  ELSE "category"
END,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "category" IN ('Kaffee', 'Zuhause', 'Wochenende');

ALTER TABLE "Meme" ADD CONSTRAINT "Meme_category_check"
CHECK ("category" IN ('Ohne Kategorie', 'Programmieren', 'Alltag', 'Arbeit', 'Sport', 'Spiele', 'Technik', 'Tiere', 'Filme', 'Draußen', 'Lernen', 'Getränke', 'Essen', 'Urlaub', 'Bücher', 'Besprechungen'));

COMMIT;

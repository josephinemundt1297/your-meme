BEGIN;

-- Alle bestehenden Memes behalten; ungueltige Kategorien werden neutralisiert.
ALTER TABLE "Meme" DROP CONSTRAINT IF EXISTS "Meme_category_check";

UPDATE "Meme"
SET "category" = 'Ohne Kategorie',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "category" IS NULL
   OR "category" NOT IN (
     'Ohne Kategorie', 'Programmieren', 'Alltag', 'Arbeit',
     'Sport', 'Spiele', 'Technik', 'Tiere', 'Filme',
     'Draußen', 'Lernen', 'Getränke', 'Essen',
     'Urlaub', 'Bücher', 'Besprechungen'
   );

ALTER TABLE "Meme" ADD CONSTRAINT "Meme_category_check"
CHECK ("category" IN (
  'Ohne Kategorie', 'Programmieren', 'Alltag', 'Arbeit',
  'Sport', 'Spiele', 'Technik', 'Tiere', 'Filme',
  'Draußen', 'Lernen', 'Getränke', 'Essen',
  'Urlaub', 'Bücher', 'Besprechungen'
));

COMMIT;

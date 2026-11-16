ALTER TABLE "Meme" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Ohne Kategorie';

-- Auch direkte Datenbank-Schreibzugriffe dürfen nur bekannte Kategorien verwenden.
ALTER TABLE "Meme" ADD CONSTRAINT "Meme_category_check"
CHECK ("category" IN ('Ohne Kategorie', 'Programmieren', 'Alltag', 'Arbeit', 'Sport', 'Gaming', 'Tech', 'Animal', 'Movies', 'Outdoor', 'Study', 'Drinks', 'Food', 'Holiday', 'Book', 'Meeting'));

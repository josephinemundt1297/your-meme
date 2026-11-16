import { z } from "zod";

// Vereinbarte deutsche Kategorien; Dileks Frontend verwendet dieselben API-Werte.
export const categories = [
  "Ohne Kategorie",
  "Arbeit",
  "Programmieren",
  "Kaffee",
  "Tiere",
  "Essen",
  "Lernen",
  "Spiele",
  "Zuhause",
  "Wochenende",
] as const;

// z ist der importierte Zod-Zugriff. enum (Enumeration = Aufzählung) ist ein
// fester Zod-Name: Zur Laufzeit sind nur Werte aus categories erlaubt.
export const categorySchema = z.enum(categories);

// infer bedeutet „ableiten“ und ist ebenfalls ein fester Zod-Name.
// Hier wird der TypeScript-Typ Category aus categorySchema abgeleitet.
// Eigene Namen wie categories, categorySchema und Category sind frei wählbar.
export type Category = z.infer<typeof categorySchema>;

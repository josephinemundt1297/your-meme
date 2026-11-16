# Backend-Architektur

Stand: 16.11.2026. Fachliche Module mit getrennten Routen, Controllern und Services; keine zusätzliche Repository- oder Framework-Schicht.

## Zuständigkeiten

| Bereich | Aufgabe |
| --- | --- |
| `src/server.ts` | Dienstanbindungen bereitstellen, Port prüfen, Server und Bildbereinigungs-Wiederholungen starten |
| `src/app.ts` | Express-App erstellen, CORS/Anfragebegrenzung/JSON/Clerk einhängen, Router verbinden; zuletzt 404 und Fehlerbehandlung |
| `*.routes.ts` | Methode und URL dem passenden Controller zuordnen |
| `*.controller.ts` | Verifizierte Identität aus der Auth-Middleware verwenden, Parameter und Body validieren, Service aufrufen, Status und JSON senden |
| `*.service.ts` | Fachliche Abläufe, Besitzer-/ADMIN-Prüfungen und Datenzugriffe; keine Express-Requests oder Responses |
| `src/middleware/` | Wiederverwendbare HTTP-Schritte: Anmeldung geschützter Routen, Anfragebegrenzung, Dateiannahme und Fehlerantworten |
| `src/validators/` | Zod-Schemas für Eingaben |
| `src/utils/` | Kleine Hilfsfunktionen und erwartete fachliche Fehler |
| `src/lib/` | Prisma-/Cloudinary-Anbindung, Bildübertragung und gemeinsame Meme-Feldauswahl |
| `src/types/dependencies.ts` | Typisierte Dienste, die beim Erstellen der App übergeben werden |

Die Zerlegung übernimmt den Gedanken kleiner, zusammensetzbarer Bausteine. Im Backend sind fachliche Module und die Trennung von HTTP und Fachlogik verständlicher als UI-Bezeichnungen wie Atome, Moleküle und Organismen. Eine zusätzliche Repository-, Klassen- oder Framework-Schicht ist nicht nötig.

## Module und bestehende API

Alle Router werden in `app.ts` unter `/api` eingebunden. Innerhalb der Router wird dieser Präfix nicht wiederholt.

| Modul | Methoden und Pfade einschließlich `/api` |
| --- | --- |
| `health` | `GET /api/health`, `GET /api/health/db` |
| `users` | `GET /api/me`, `POST /api/me/sync` |
| `memes` | `GET /api/memes`, `POST /api/memes`, `GET/PATCH/DELETE /api/memes/:id`, `POST/DELETE /api/memes/:id/like` |
| `comments` | `GET/POST /api/memes/:id/comments`, `PATCH/DELETE /api/comments/:id` |
| `folders` | `GET/POST /api/folders`, `GET/PATCH/DELETE /api/folders/:id`, `POST /api/folders/:id/memes`, `DELETE /api/folders/:id/memes/:memeId` |

Das sind 22 Kombinationen aus Methode und Pfad. Likes bleiben beim Meme-Modul. Health hat wegen seiner zwei kleinen Statusabfragen nur Router und Controller.

## Beispiel: einen Ordner umbenennen

1. Der Folder-Router nimmt `PATCH /api/folders/:id` entgegen.
2. Die gemeinsame requireAuth-Middleware prüft die Anmeldung und hinterlegt die verifizierte Clerk-ID in res.locals. Der Controller prüft die UUID und den Ordnernamen.
3. Der Service lädt den Ordner, prüft den Besitzer und speichert den neuen Namen.
4. Der Controller gibt das Ergebnis als JSON mit Status 200 zurück.
5. Bei einem erwarteten Fehler wirft der Service `HttpError`, beispielsweise 403 für einen fremden Ordner. Der gemeinsame handleRequest-Wrapper übernimmt Status und Meldung. Unerwartete Fehler erhalten weiterhin die jeweilige bisherige 500-Antwort der Route.

Die Clerk-Benutzerkennung heißt in Services `clerkUserId`; das Datenbankfeld `userId` enthält weiterhin die lokale Benutzer-UUID. Beide Werte sind verschieden.

## Tests und Grenzen

`npm test` baut TypeScript und prüft die tatsächliche Express-App über lokale HTTP-Anfragen. Authentifizierung, Datenbank, Clerk-Nutzerdienst und Bildspeicher sind dabei simuliert. Zwei PostgreSQL-Tests laufen nur mit ausdrücklichem `RUN_DATABASE_TESTS=1` und erlauben ausschließlich eine lokale Projektdatenbank; niemals die gemeinsame Datenbank als Testziel verwenden.

Abgedeckt sind unter anderem Anmeldung, Besitzer-/ADMIN-Rechte, private Ordner, Validierung, JSON-Parserfehler, CORS, persönliche Likes, Kategorien, Pagination, Anfragebegrenzung und PNG-Uploads einschließlich Fehlerbereinigung. Die PostgreSQL-Tests prüfen Transaktionen, Kaskaden, persistierte Bildaufträge und Kategorienmigration.

Diese Tests ersetzen keine authentifizierte Browser-Abnahme mit echten Clerk-/Cloudinary-Diensten. Historische Refactoring-Vergleiche, frühere Testzahlen und Live-Prüfungen stehen im [Projektstand](projektstand.md).

## Ergänzung vom 16.11.2026 – Bildbereinigung

`modules/memes/image-deletion.service.ts` verarbeitet minimale persistierte Aufträge. Der Meme-Service legt den Auftrag und die Inhaltslöschung gemeinsam über Prisma `$transaction` an; erst danach wird Cloudinary angesprochen. `server.ts` startet die Wiederholung; `createApp` bleibt ohne Timer oder Portöffnung. `handleRequest` behandelt echte Prisma-Konflikte ohne Ausgabe von SQL- oder Request-Inhalten. [Daten und Grenzen](bildloeschung.md).

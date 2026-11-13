# Backend-Architektur

Stand: 13.11.2026. Freigegebene Aufteilung auf Branch `Backend`; keine zusätzlichen Funktionen oder Pakete.

## Zuständigkeiten

| Bereich | Aufgabe |
| --- | --- |
| `src/server.ts` | Konkrete Prisma-, Clerk- und Cloudinary-Anbindung bereitstellen, Port prüfen, Server starten |
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

`npm test` baut TypeScript und führt 72 Tests mit dem Node-Testläufer aus. Die Tests starten die tatsächliche Express-App auf einem freien lokalen Port. Dadurch werden Router, Middleware, Controller und Services gemeinsam geprüft. Simuliert werden ausschließlich Authentifizierung sowie Datenbank-, Clerk-Nutzer- und Bildspeicherdienste. Die Test-Datenbank berücksichtigt die angeforderte Feldauswahl.

Abgedeckt sind unter anderem Anmeldung, Besitzer-/ADMIN-Rechte, private Ordner, Validierung, JSON-Parserfehler, CORS, persönliche Likes, Ordner-Zuordnungen und PNG-Uploads einschließlich Bereinigung nach Datenbankfehlern. Die bisherigen 21 Moderationstests verwenden jetzt diese HTTP-Testumgebung, statt Handler aus dem Text der Serverdatei auszulesen.

Vor der anschließenden Bereinigung wurde die gesicherte alte Serverdatei einmalig mit der aufgeteilten App in 99 Fällen verglichen: Status, JSON-Antwort, Content-Type, CORS sowie Argumente und Reihenfolge externer Dienstaufrufe stimmten überein. Dieser Vergleich ist ein lokaler Refactoring-Nachweis; die alte Monolith-Datei und das Vergleichsskript gehören nicht zum Anwendungscode.

Diese Prüfung belegt keine erneute Live-Abnahme von Clerk, PostgreSQL, Cloudinary oder der Frontend-Oberfläche. Echte Zugangsdaten, Konten und Bilder wurden in den Regressionstests nicht verwendet. Dienstübergreifende Teilausfälle bleiben offen. Die nachfolgende freigegebene Bereinigung ergänzt inzwischen likedByMe in allen Meme-Antworten und behebt den Validator-Beispielcode sowie die PNG-Meldung. Persönliche Likes für mehrere Memes werden über getLikedMemeIds gemeinsam geladen.

Nach den Regressionstests wurde der gebaute Server zusätzlich mit der vorhandenen lokalen Konfiguration auf einem freien Testport gestartet. Ausschließlich lesend geprüft: Health 200, PostgreSQL-Health 200/connected und Meme-Liste 200 mit 32 Memes sowie CORS für localhost:5173. Danach wurde nur dieser zusätzliche Testserver beendet. Angemeldete Schreibaktionen und Cloudinary-Übertragungen wurden dabei nicht erneut ausgeführt.

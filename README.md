# Your Meme

Fullstack-Abschlussprojekt von Dilek (Frontend) und Josephine (Backend).
Stand: 11.11.2026. Abgabe: 23.11.2026; Präsentationstermin offen. Deployment ist freiwillig, eine lokale Präsentation ist zulässig.

## Aktueller Stand

- Frontend: React, TypeScript, Vite, TanStack Router und Clerk. Die Übersicht lädt echte API-Daten und zeigt Bilder; die Detailseite verwendet noch Beispieldaten. Upload und Likes sind bisher lokale Demonstrationen.
- Backend: Express, TypeScript, PostgreSQL und Prisma. Öffentliche Meme- und Kommentarabfragen, CORS, Clerk-Identitätsprüfung und lokale Nutzer-Synchronisation sind implementiert.
- Cloudinary ist als Bildspeicher eingerichtet. Die API prüft nun angemeldete PNG-Uploads (ein Bild, maximal 5 MiB), speichert aber noch nichts. Die Cloudinary-Uploadfunktion ist als noch nicht angebundene Hilfsfunktion vorhanden.
- Bearbeiten/Löschen, echte Likes, Kommentarverwaltung, persönliche Ordner, Moderation und Kontolöschung sind noch nicht vollständig umgesetzt.
- Geprüfte Ergebnisse und Grenzen: [Projektstand](backend/docs/projektstand.md).

## Gemeinsam lokal starten

Aktuellen gemeinsamen Projektstand verwenden. Node.js 24 und npm sowie eine laufende PostgreSQL-Projektdatenbank werden benötigt. Backend und Frontend laufen in zwei getrennten Terminals.

### Backend – Port 3000

Im Ordner `backend/`:

```bash
npm ci
```

Eine eigene `.env` nach [Backend-Startanleitung](backend/README.md) einrichten: PostgreSQL-Verbindung, Clerk-Schlüssel und für Cloudinary-Zugriffe die Cloudinary-Zugangsdaten. Vorhandene `.env` nicht überschreiben.

```bash
npx prisma generate
npx prisma migrate status
```

Nur für eine neue, leere Projektdatenbank nach Prüfung der Verbindung die vorhandene Migration mit `npx prisma migrate deploy` anwenden. Danach:

```bash
npm run dev
```

- Server: `http://localhost:3000/api/health`
- Datenbank: `http://localhost:3000/api/health/db`
- Meme-Liste: `http://localhost:3000/api/memes`

Lokale Datenbankinhalte werden nicht automatisch über Git geteilt. Für eine neue Projektdatenbank stehen inzwischen versionierte Bild-Testdaten bereit. Nach Migration und Client-Generierung im Ordner `backend/` einmal ausführen:

```bash
npx tsx prisma/import-test-memes.ts
```

Das Skript importiert 29 Meme-Datensätze aus `prisma/test-memes.json` und ordnet neue Einträge dem Demo-Profil `Meme-Testdaten` zu. Vorhandene Meme-IDs werden übersprungen. Keine echten Clerk-Konten, Kommentare, Likes oder Ordner werden übernommen. Die Bilder bleiben bei Cloudinary; verwendet werden dieselben öffentlichen Bildadressen. Vor dem Import muss `DATABASE_URL` auf die eigene lokale Projektdatenbank zeigen. Josephine bestätigt inzwischen den funktionierenden Start und die Anzeige bei Dilek.

### Frontend – normalerweise Port 5173

Im Ordner `frontend/`:

```bash
npm ci
```

Eine lokale `frontend/.env.local` einrichten:

```env
VITE_CLERK_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
VITE_API_URL=http://localhost:3000
```

Frontend und Backend müssen dieselbe Clerk-Anwendung verwenden. Der Secret Key gehört ausschließlich ins Backend.

```bash
npm run dev
```

Die im Terminal angezeigte Adresse öffnen, normalerweise `http://localhost:5173/`. Der Frontend-Pfad `/api/memes` ist keine Anwendungsseite. Bei einem anderen Frontend-Port muss die Backend-CORS-Konfiguration dazu passen. Nach Env-Änderungen neu starten.

## Prüfungen

- Backend: `npm run typecheck`, `npx prisma validate`; Build: `npm run build`.
- Frontend: `npm run lint`, `npm run build`.
- Typprüfung und Build ersetzen keine Funktions- oder Berechtigungstests; ein automatisiertes Backend-Testskript fehlt noch.

## Unterlagen und Zusammenarbeit

- [Backend-Startanleitung](backend/README.md)
- [Backend-Spezifikation](backend/SPECK.md)
- [Datenmodell](backend/docs/datenmodell.md)
- [Implementierte API und Planung](backend/docs/api-plan.md)
- [Projektstand und Arbeitsweise](backend/docs/projektstand.md)
- [Zwischenbericht für Dilek vom 11.11.2026](backend/docs/zwischenbericht-2026-11-11.md)
- [Historisches Hand-out vom 30.10.2026](backend/docs/handout-2026-10-30.md)
- [Trello-Board](https://trello.com/b/EpjAfv15/your-meme)

Die Branches `Backend`, `Frontend` und `main` existieren bereits. Ein Branch umfasst das gesamte Repository; Ordner und Branches sind unterschiedliche Dinge. Änderungen vor dem Zusammenführen gemeinsam prüfen. Commit, Push und Merge erfolgen nur auf ausdrücklichen Auftrag. Backend-Regeln stehen in `backend/AGENTS.md` und gelten nur für diesen Bereich.

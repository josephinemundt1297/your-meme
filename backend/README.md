# Your Meme – Backend

Express-/TypeScript-API mit PostgreSQL/Prisma, Clerk und Cloudinary. Stand: 16.11.2026. Die API unterstützt Memes, Kategorien, Kommentare, Likes, private Ordner und ADMIN-Löschrechte. Vollständige Kontolöschung ist noch offen.

## Einrichtung

Voraussetzungen: Node.js ab Version 24, npm sowie Zugang zur vereinbarten Clerk-Anwendung und zu Cloudinary. Alle Befehle in `backend/` ausführen:

```bash
npm ci
npx prisma generate
npm run typecheck
npm run dev
```

Falls noch keine `.env` vorhanden ist, `.env.example` kopieren und die Platzhalter ersetzen. Eine vorhandene Konfiguration beibehalten. Benötigte Variablen:

| Variable | Verwendung |
| --- | --- |
| `PORT` | Optional, standardmäßig 3000 |
| `DATABASE_URL` | Datenbankzugang für das laufende Backend |
| `DIRECT_DATABASE_URL` | Optionaler separater Eigentümerzugang für Prisma-Migrationen |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Backend-Anbindung an Clerk |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Bildspeicher für Upload und Löschung |

Verbindungsdaten und Secret Keys gehören ausschließlich in lokale, von Git ausgeschlossene Dateien. Nur der öffentliche Clerk-Schlüssel darf als `VITE_CLERK_PUBLISHABLE_KEY` ins Frontend. Nach Änderungen an der `.env` den Server neu starten. Fehlende Cloudinary-Konfiguration verhindert den Serverstart.

## Gemeinsame Datenbank

Der freigegebene Projektstand liegt in Neon Free, Frankfurt, PostgreSQL 18. Josephines Backend verwendet die gemeinsame Datenbank bereits. Dilek erhält ihren eigenen eingeschränkten Zugang privat; Anschluss und Prüfbelege stehen in [Gemeinsame Datenbank](docs/gemeinsame-datenbank.md).

Beide Backends greifen über `DATABASE_URL` auf dieselben Daten zu. Bilder bleiben bei Cloudinary; PostgreSQL speichert Bildadressen und exakte Cloudinary-Public-IDs. Git überträgt Code und Migrationen, keine Datenbankinhalte. Einen Fixture-Import auf dem gemeinsamen Ziel nicht erneut ausführen.

Prisma CLI verwendet `DIRECT_DATABASE_URL`, falls gesetzt, sonst `DATABASE_URL`:

```bash
npx prisma validate
npx prisma migrate status
```

`validate` prüft das Schema und belegt keine Datenbankverbindung. `migrate status` liest den Migrationsstand. Es bestehen vier versionierte Migrationen; bereits angewendete Dateien nicht ändern. Neue Migrationen werden von Josephine abgestimmt ausgeführt. `npx prisma migrate deploy` verändert die konfigurierte Datenbank und benötigt den Migrationszugang.

Für eine getrennte, leere lokale Entwicklungsdatenbank können nach Anwendung der Migrationen die Demo-Daten mit `npx tsx prisma/import-test-memes.ts` importiert werden. Das Skript verwendet `DATABASE_URL`, überspringt vorhandene Meme-IDs und korrigiert deren Inhalte nicht. Fixture-Bilder sind gemeinsam genutzte Cloudinary-Originale; für Löschtests eigene Testbilder verwenden.

## API und Anmeldung

Backend: `http://localhost:3000`. CORS erlaubt `http://localhost:5173`.

| Anfrage | Erwartung |
| --- | --- |
| `GET /api/health` | 200, Server erreichbar |
| `GET /api/health/db` | 200 bei erreichbarer Datenbank, sonst 503 |
| `GET /api/memes` | 200, Array, standardmäßig erste 50 Memes |
| `GET /api/memes?category=Tiere` | 200, ausschließlich Treffer dieser Kategorie |
| `POST /api/me/sync` | Mit Clerk-Token lokales Profil anlegen/aktualisieren |

Geschützte Anfragen benötigen `Authorization: Bearer <SESSION_TOKEN>`. Der Clerk Secret Key ist kein Nutzer-Token. Vor Upload, Kommentar-Erstellung und Likes muss das lokale Profil über `/api/me/sync` vorhanden sein, sonst 409. Für persönliche Likes auch bei Meme-GETs den Token mitsenden. Lokale Profil-UUID und Clerk-ID sind verschiedene Werte.

Kategorien: **Programmieren, Alltag, Arbeit, Sport, Spiele, Technik, Tiere, Filme, Draußen, Lernen, Getränke, Essen, Urlaub, Bücher und Besprechungen** sowie **Ohne Kategorie**. „Alle Memes“ bedeutet: `category` weglassen. Ungültige Werte ergeben 400. Die Website-Adresse `/?category=Tiere` muss im Frontend als API-Parameter weitergegeben werden.

Upload: `POST /api/memes` als FormData mit `title` (getrimmt 1–100 Zeichen), `image` (genau ein PNG bis 5 MiB) und optional `category` (Standard Ohne Kategorie). `imageUrl` und `imageStorageId` entstehen ausschließlich beim Upload. Besitzer ändern Titel/Kategorie per PATCH. Alle Methoden, Antwortfelder, Rechte und Statuscodes stehen im [API-Vertrag](docs/api-plan.md).

Meme-DELETE entfernt Inhalt und speichert einen Bildauftrag atomar. 204 bedeutet abgeschlossene Bildbereinigung; 503 kann bedeuten, dass der Inhalt bereits entfernt und die externe Bereinigung noch offen ist. Der Server wiederholt offene Aufträge. [Ablauf und Datenschutzgrenzen](docs/bildloeschung.md).

## Grenzen und Tests

Die Meme-Liste akzeptiert `page` (1–10000), `limit` (1–100) und optional `category`. Sortierung: createdAt/id absteigend. Header `X-Page`, `X-Limit`, `X-Has-More` sind über CORS lesbar. Kommentar- und Ordnerlisten sind noch nicht paginiert.

Pro IP und Serverprozess innerhalb von 60 Sekunden: 300 API-Anfragen, 60 Schreibanfragen, 10 Uploads. Überschreitung: 429 mit `Retry-After`; ausgelasteter Limiter: 503. Die Zähler liegen im Prozessspeicher. Ein Betrieb hinter einem Reverse Proxy benötigt eine abgestimmte Konfiguration.

```bash
npm run typecheck
npm test
```

`npm test` baut TypeScript und prüft die tatsächliche Express-App über lokale HTTP-Anfragen mit simulierten Datenbank-, Clerk- und Cloudinary-Diensten. Zwei zusätzliche PostgreSQL-Tests sind standardmäßig übersprungen. `RUN_DATABASE_TESTS=1 npm test` ausschließlich mit einer getrennten lokalen Projektdatenbank verwenden; die Tests verweigern externe Ziele. Die Tests ersetzen keine authentifizierte Browser-Abnahme mit den echten Diensten.

Für den gebauten Server: `npm run build`, danach `npm start`. Der Build liegt in `dist/`.

Vollständige Kontolöschung, vereinbarte Backup-/Log-Aufbewahrung und gemeinsame Browser-/Upload-Abnahme mit Dilek bleiben offen. Es liegt keine vollständige DSGVO-Abnahme vor.

[Architektur](docs/architektur.md) · [Datenmodell](docs/datenmodell.md) · [Projektstand und historische Prüfbelege](docs/projektstand.md)

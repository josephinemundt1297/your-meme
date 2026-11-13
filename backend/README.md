# Your Meme – Backend starten

Stand: 13.11.2026. Express-/TypeScript-API mit PostgreSQL/Prisma, Clerk und Cloudinary für Meme-Upload und -Löschung. Kommentar-Schreibaktionen, Titeländerung, Likes, persönliche Like-GETs, zentrale JSON-Fehlerbehandlung, Ordner einschließlich Umbenennen/Löschen und ADMIN-Löschrechte sind implementiert. Die API ist in fachliche Module mit getrennten Routen, Controllern und Services aufgeteilt.

## Voraussetzungen und Installation

- Node.js 24 und npm verwenden. Die Paketkonfiguration erlaubt noch `>=22.9.0`, obwohl Prisma laut Lockdatei mindestens Node 22.12 im 22er-Zweig benötigt; diese Angabe ist noch zu korrigieren.
- PostgreSQL muss laufen; eigene Projektdatenbank und Benutzerzugang einrichten.
- Zugriff auf dieselbe Clerk-Anwendung wie das Frontend.
- Cloudinary-Zugangsdaten für den Cloudinary-Client und den Upload.

Alle folgenden Befehle im Ordner `backend/` ausführen:

```bash
npm ci
```

## Lokale Konfiguration

Falls noch keine `.env` vorhanden ist, `.env.example` kopieren und ergänzen. Eine vorhandene `.env` beibehalten. Die Vorlage enthält die benötigten Variablennamen; die eigenen Werte lokal ergänzen.

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORT@localhost:5432/DEINE_DATENBANK?schema=public"
CLERK_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
CLERK_SECRET_KEY=DEIN_SECRET_KEY
CLOUDINARY_CLOUD_NAME=DEIN_CLOUD_NAME
CLOUDINARY_API_KEY=DEIN_API_KEY
CLOUDINARY_API_SECRET=DEIN_API_SECRET
```

Dies sind Platzhalter, keine gültigen Zugangsdaten. `PORT` ist optional. PostgreSQL-Zugangsdaten gehören zum jeweiligen Rechner; `localhost` bezeichnet immer diesen Rechner. Sonderzeichen im Benutzer-/Passwortteil der Verbindungs-URL müssen URL-kodiert werden.

Express erwartet `CLERK_PUBLISHABLE_KEY`, ohne `NEXT_PUBLIC_` oder `VITE_`. Nur im Frontend heißt die Variable `VITE_CLERK_PUBLISHABLE_KEY`. API-Secret und Clerk Secret Key niemals im Frontend speichern. `.env` ist aus Git ausgeschlossen.

Der Cloudinary-Client liest die drei Cloudinary-Variablen beim Import. Er wird von Upload und Löschung verwendet. Fehlende Cloudinary-Variablen verhindern deshalb den Serverstart; öffentliche Meme-Abfragen selbst lesen gespeicherte Bildadressen.

## Prisma und Datenbank

```bash
npx prisma generate
npx prisma validate
npx prisma migrate status
```

- `generate`: erzeugt den nicht versionierten Client unter `src/generated/prisma/`.
- `validate`: prüft das Schema, belegt keine Datenbankverbindung.
- `migrate status`: vergleicht die Migrationen mit der konfigurierten Datenbank.
- Die installierte CLI erkennt `prisma7.config.ts`; diese Datei lädt die `.env`.

Für eine neue, leere Projektdatenbank nach Kontrolle von `DATABASE_URL`:

```bash
npx prisma migrate deploy
```

Dieser Befehl verändert die ausgewählte Datenbank. Bei einer befüllten Datenbank zuerst den Migrationsstand klären. Die Migration `20261104125318_init` ist vorhanden; keine zweite Init-Migration erzeugen.

Git überträgt keine Datenbankinhalte automatisch. Eine frische Datenbank liefert `[]`. Die versionierten Testdaten lassen sich nach Einrichtung der Tabellen und Client-Generierung importieren:

```bash
npx tsx prisma/import-test-memes.ts
```

Das Skript schreibt in die Datenbank aus `DATABASE_URL`: 29 Meme-Vorlagen aus `prisma/test-memes.json`, zugeordnet zum Demo-Nutzer `Meme-Testdaten`. Vorhandene IDs werden übersprungen; wiederholter Import erzeugt keine doppelten Meme-IDs. Keine echten Clerk-IDs, Kommentare, Likes oder Ordner werden übernommen. Das Demo-Profil hat keine echte Clerk-Anmeldung. Cloudinary-Bilder werden nicht neu hochgeladen; die vorhandenen öffentlichen Adressen bleiben gemeinsam genutzt. Josephine bestätigt den funktionierenden Import-/Anzeigestand bei Dilek. Alternativ können einzelne Testdatensätze mit `npx prisma studio` angelegt werden. Ein Meme braucht einen vorhandenen Ersteller, Titel, Bildadresse und Cloudinary-Public-ID als `imageStorageId`. UUIDs und `updatedAt` erzeugt der Prisma Client; die SQL-Migration enthält dafür keinen Datenbank-Standardwert. Studio kann deshalb manuelle Werte verlangen. Testdaten-Anlage ist noch keine Upload-Funktion.

## Server starten und prüfen

```bash
npm run dev
```

Standardadresse: `http://localhost:3000`. Nach Env-Änderungen den Server neu starten; mit Strg+C beenden. CORS erlaubt derzeit genau `http://localhost:5173`. Das Frontend wird unter `http://localhost:5173/` geöffnet.

| Anfrage | Erwartung |
| --- | --- |
| `GET /api/health` | 200, `{ "status": "ok" }`; nur Serverstatus |
| `GET /api/health/db` | 200 und `database: "connected"`; bei DB-Ausfall 503 |
| `GET /api/memes` | 200, Array; ohne Testdaten `[]` |
| `GET /api/memes/:id` | 200, einzelnes Meme; ungültige UUID 400; fehlendes Meme 404 |
| `GET /api/memes/:id/comments` | 200, Kommentar-Array; ohne Kommentare `[]` |
| `GET /api/me` | Ohne Anmeldung 401; mit gültigem Session-Token 200 und Clerk-ID |
| `POST /api/me/sync` | Ohne Anmeldung 401; mit gültiger Anmeldung lokales Profil anlegen/aktualisieren |
| `POST /api/memes` | PNG und Titel als multipart; 201 mit gespeichertem Meme |
| `PATCH /api/memes/:id` | Eigenen Titel ändern, JSON title; 200 |
| `DELETE /api/memes/:id` | Eigenes Meme und Bild löschen; 204 ohne Body |
| `POST /api/memes/:id/comments` | JSON content, Kommentar erstellen; 201 |
| `PATCH /api/comments/:id` | Eigenen Kommentar ändern; 200 |
| `DELETE /api/comments/:id` | Eigenen Kommentar löschen; 204 |
| `POST` / `DELETE /api/memes/:id/like` | Eigenen Like setzen/entfernen; 200 mit liked und likeCount |
| `POST /api/folders` | Eigenen Ordner anlegen; JSON name, 201 |
| `GET /api/folders` | Nur eigene Ordner; 200 Array |
| `GET /api/folders/:id` | Nur eigener Ordner samt memes; 200 |
| `POST /api/folders/:id/memes` | JSON memeId, im eigenen Ordner speichern; 200 saved true |
| `DELETE /api/folders/:id/memes/:memeId` | Nur Zuordnung entfernen, Meme bleibt; 200 saved false |

Unbekannte Routen liefern 404 als JSON. Vollständige Formate und Grenzen stehen im [API-Plan](docs/api-plan.md).

## Anmeldung und lokale Nutzer

Bei Anfragen vom Frontend an Port 3000 den Clerk-Session-Token als `Authorization: Bearer <SESSION_TOKEN>` senden. Postman übernimmt die Browser-Anmeldung nicht. Session-Token sind kurzlebig; bei Ablauf einen frischen Token verwenden. Niemals den Clerk Secret Key als Nutzer-Token einsetzen.

`POST /api/me/sync` benötigt keinen Body. Die Route lädt das Clerk-Profil und verwendet `upsert` anhand der eindeutigen `clerkId`. Wiederholte Aufrufe verwenden dieselbe lokale UUID; neue Nutzer erhalten `USER`. Der Anzeigename kommt aus Clerk-Username, alternativ Vorname oder `MemeFan`. Es werden keine Passwörter gespeichert. Der Upload wartet im aktuellen Frontend auf erfolgreichen Sync; der Layout-Sync unterdrückt Fehler weiterhin. Erstlogin bei Kommentaren/Likes ohne vorherigen Upload separat prüfen.

## Cloudinary-Verbindung testen

Nach Einrichtung der lokalen Variablen kann ein lesender Ping ausgeführt werden:

```bash
npx tsx -e 'import { cloudinary } from "./src/lib/cloudinary.ts"; cloudinary.api.ping().then(result => console.log("Cloudinary:", result.status)).catch(error => { console.error("Cloudinary-Test fehlgeschlagen", error?.http_code ?? error?.error?.http_code); process.exitCode = 1; });'
```

Erwartet: `Cloudinary: ok`. Dabei wird kein Bild hochgeladen. Bei Fehlern keine vollständigen Konfigurations- oder Fehlerobjekte mit Zugangsdaten veröffentlichen.

## Typprüfung, Build und Tests

```bash
npm run typecheck
npm run build
npm test
npm start
```

`build` erzeugt `dist/`; `start` startet diesen Build. Nach Änderungen erneut bauen. `npm test` baut ebenfalls und führt 59 Tests mit dem eingebauten Node-Testläufer aus. Sie senden echte HTTP-Anfragen an lokale Express-Testserver; Clerk, PostgreSQL und Cloudinary werden dabei simuliert. Echte Konten und Bilder werden nicht verändert. Jest und Supertest sind dafür nicht erforderlich. Diese Tests ersetzen keine Abnahme mit den echten Diensten und im Browser.

## Struktur und offene Funktionen

| Datei | Aufgabe |
| --- | --- |
| `src/server.ts` | Echte Dienste bereitstellen, Port prüfen und Server starten |
| `src/app.ts` | Express konfigurieren, Module und Middleware verbinden; öffnet keinen Port |
| `src/modules/{memes,comments,folders,users}/` | Jeweils Routen, Controller und Service; Likes gehören zum Meme-Modul |
| `src/modules/health/` | Einfache Statusrouten und Controller |
| `src/types/dependencies.ts` | Typisierte Schnittstelle für die benötigten Dienste |
| `src/middleware/` | Anmeldung vor Upload, Dateiannahme, 404 und zentrale Fehlerbehandlung |
| `src/utils/HttpError.ts` | Erwartete fachliche Fehler mit Status und öffentlicher Meldung |
| `src/lib/prisma.ts` | Prisma-Client mit PostgreSQL-Adapter |
| `src/lib/memeSelect.ts` | Öffentliche Meme-Felder, Ersteller und Zähler auswählen |
| `src/utils/formatMeme.ts` | `author`, `likeCount` und `commentCount` ausgeben |
| `src/utils/isValidUuid.ts` | UUID-Grundform prüfen |
| `src/validators/meme.ts` | Zod-Schema; enthält noch ausführbaren Beispieltestcode |
| `src/lib/cloudinary.ts` | Cloudinary-SDK konfigurieren |
| `src/lib/uploadImage.ts` | PNG per Upload-Stream übertragen; wird von der POST-Route verwendet |
| `src/middleware/upload.ts` | Multer: eine Datei im Speicher, maximal 5 MiB, MIME-Vorprüfung auf PNG |
| `src/utils/isPng.ts` | PNG-Dateisignatur mit file-type erkennen; keine vollständige Bilddekodierung |
| `prisma/import-test-memes.ts`, `prisma/test-memes.json` | Gemeinsame lokale Bild-Testdaten importieren |
| `prisma/` | Schema und vorhandene Migration |
| `.agents/skills/`, `.claude/skills/`, `.windsurf/skills/` | Werkzeughilfen und Verknüpfungen, kein Anwendungscode |

Die Zuständigkeiten und ein Beispielablauf stehen in [Backend-Architektur](docs/architektur.md). URL-Pfade, Antwortfelder und bestehende Berechtigungen wurden bei dieser Aufteilung beibehalten.

`POST /api/memes` erwartet `FormData`: `title` als Text, `image` als Datei und Bearer-Token. Genau ein PNG bis 5 MiB, Titel getrimmt 1–100 Zeichen. Erfolg 201 liefert das gespeicherte Meme. Kommentare erwarten JSON `content` (1–1000 Zeichen), Titeländerung JSON `title`. DELETE und Like-Anfragen benötigen keinen Body. Bei 204 keine JSON-Antwort auslesen.

Vor Upload, Kommentar-Erstellung und Likes muss das lokale Profil über `/api/me/sync` vorhanden sein, sonst 409. Profil-ID aus der Sync-Antwort ist eine lokale UUID; Clerk-ID ist ein anderer Wert. Vollständige Anfrage-/Antwortformate und Statuscodes: [API-Vertrag](docs/api-plan.md).

## Offene Arbeiten und bekannte Grenzen

- Vollständige Kontolöschung über DB, Clerk und Cloudinary fehlt. ADMIN darf fremde Memes/Kommentare löschen, aber weder fremde Inhalte bearbeiten noch fremde private Ordner verwalten.
- GET /api/memes und GET /api/memes/:id liefern likedByMe. Bearer-Token auch bei diesen GETs mitsenden. Meme-POST/PATCH und Ordner-Memes enthalten dieses Feld noch nicht.
- Zentrale JSON-Fehlerbehandlung ist vorhanden: kaputtes JSON 400, zu großer JSON-Body 413, unerwartete Fehler 500. Parserfälle heute live als JSON ohne interne Details geprüft. Pagination und Rate-Limits fehlen.
- Generische Upload-Meldung enthält JPNG; Validator enthält ausführbaren Beispieltest. Beide wurden bei der Strukturänderung beibehalten.
- Cloudinary und PostgreSQL sind nicht atomar gekoppelt: Teilausfälle können weitere Bereinigung benötigen. Nur separate eigene Upload-Testbilder für Löschtests verwenden; Fixture-Originale sind gemeinsam genutzt.
- Der aktuelle Frontend-Funktionsstand wurde bei dieser Backend-Strukturänderung nicht erneut bewertet. Historische Beobachtungen stehen mit Datum im Projektstand; Dileks Arbeitsprotokoll dokumentiert ihre Änderungen.

[API-Vertrag](docs/api-plan.md) · [Projektstand und Prüfgrenzen](docs/projektstand.md)

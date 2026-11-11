# Your Meme – Backend starten

Stand: 11.11.2026. Express-/TypeScript-API mit PostgreSQL/Prisma, Clerk und vorbereiteter Cloudinary-Anbindung. Die Upload-Prüfung ist implementiert; Cloudinary-Upload und Meme-Speicherung sind noch nicht an die Route angeschlossen.

## Voraussetzungen und Installation

- Node.js 24 und npm verwenden. Die Paketkonfiguration erlaubt noch `>=22.9.0`, obwohl Prisma laut Lockdatei mindestens Node 22.12 im 22er-Zweig benötigt; diese Angabe ist noch zu korrigieren.
- PostgreSQL muss laufen; eigene Projektdatenbank und Benutzerzugang einrichten.
- Zugriff auf dieselbe Clerk-Anwendung wie das Frontend.
- Cloudinary-Zugangsdaten für den Cloudinary-Client und den späteren Upload.

Alle folgenden Befehle im Ordner `backend/` ausführen:

```bash
npm ci
```

## Lokale Konfiguration

Falls noch keine `.env` vorhanden ist, `.env.example` kopieren und ergänzen. Eine vorhandene `.env` beibehalten. Die Vorlage enthält noch keine Cloudinary-Einträge; diese wie unten ergänzen.

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

Der Cloudinary-Client liest die drei Cloudinary-Variablen beim Import. Er wird noch nicht von einer Upload-Route verwendet; öffentliche Meme-Abfragen lesen nur die gespeicherten Bildadressen.

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
| `POST /api/memes` | Angemeldete multipart-Prüfung für PNG und Titel; 200 bedeutet derzeit nur Prüfung, keine Speicherung |

Unbekannte Routen liefern 404 als JSON. Vollständige Formate und Grenzen stehen im [API-Plan](docs/api-plan.md).

## Anmeldung und lokale Nutzer

Bei Anfragen vom Frontend an Port 3000 den Clerk-Session-Token als `Authorization: Bearer <SESSION_TOKEN>` senden. Postman übernimmt die Browser-Anmeldung nicht. Session-Token sind kurzlebig; bei Ablauf einen frischen Token verwenden. Niemals den Clerk Secret Key als Nutzer-Token einsetzen.

`POST /api/me/sync` benötigt keinen Body. Die Route lädt das Clerk-Profil und verwendet `upsert` anhand der eindeutigen `clerkId`. Wiederholte Aufrufe verwenden dieselbe lokale UUID; neue Nutzer erhalten `USER`. Der Anzeigename kommt aus Clerk-Username, alternativ Vorname oder `MemeFan`. Es werden keine Passwörter gespeichert. Der automatische Aufruf aus dem Frontend fehlt noch.

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
npm start
```

`build` erzeugt `dist/`; `start` startet diesen Build. Nach Änderungen erneut bauen. Ein automatisiertes Testskript, Jest und Supertest fehlen noch. Typprüfung und Build ersetzen keine Funktions- oder Rechteprüfung.

## Struktur und offene Funktionen

| Datei | Aufgabe |
| --- | --- |
| `src/server.ts` | Express, CORS, Clerk, öffentliche Abfragen, Nutzer-Synchronisation, Upload-Prüfung und Lösch-Platzhalter |
| `src/lib/prisma.ts` | Prisma-Client mit PostgreSQL-Adapter |
| `src/lib/memeSelect.ts` | Öffentliche Meme-Felder, Ersteller und Zähler auswählen |
| `src/utils/formatMeme.ts` | `author`, `likeCount` und `commentCount` ausgeben |
| `src/utils/isValidUuid.ts` | UUID-Grundform prüfen |
| `src/validators/meme.ts` | Zod-Schema; enthält noch ausführbaren Beispieltestcode |
| `src/lib/cloudinary.ts` | Cloudinary-SDK konfigurieren |
| `src/lib/uploadImage.ts` | PNG per Upload-Stream übertragen; liefert Bildadresse/Public ID, noch nicht in der Route verwendet |
| `src/middleware/upload.ts` | Multer: eine Datei im Speicher, maximal 5 MiB, MIME-Vorprüfung auf PNG |
| `src/utils/isPng.ts` | PNG-Dateisignatur mit file-type erkennen; keine vollständige Bilddekodierung |
| `prisma/import-test-memes.ts`, `prisma/test-memes.json` | Gemeinsame lokale Bild-Testdaten importieren |
| `prisma/` | Schema und vorhandene Migration |
| `.agents/skills/`, `.claude/skills/`, `.windsurf/skills/` | Werkzeughilfen und Verknüpfungen, kein Anwendungscode |

`POST /api/memes` erwartet jetzt `multipart/form-data`: `title` als Text, `image` als Datei, gültiger Bearer-Session-Token. Nur PNG, genau ein Bild, maximal 5 × 1024 × 1024 Bytes; Titel getrimmt mit 1–100 Zeichen. Erfolg liefert 200 mit `Upload-Prüfung erfolgreich. Noch nichts gespeichert.` Fehler: ohne Anmeldung 401, ungültige Eingaben 400, zu große Datei 413. Postman/FormData setzen den Content-Type samt Boundary automatisch. Eine generische Fehlerantwort sagt im Code noch fälschlich JPG/JPEG; tatsächlich wird PNG geprüft.

`uploadImage` wird noch nicht aufgerufen; lokale Erstellerzuordnung, Cloudinary-Upload, Datenbankanlage und Bereinigung bei Teilausfällen fehlen in der Route. `DELETE /api/memes/:id` bleibt ein 503-Platzhalter. Bearbeiten/Löschen mit Rechteprüfung, Likes, Kommentarverwaltung, Ordner, Moderation und Kontolöschung fehlen. Details: [Projektstand](docs/projektstand.md), [Spezifikation](SPECK.md).

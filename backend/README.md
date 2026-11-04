# Your Meme – Backend starten

Stand: 04.11.2026. Express-/TypeScript-Grundgerüst mit vorbereiteter PostgreSQL-/Prisma-Anbindung.
Aktuell wird mit Node.js 24 gearbeitet; bei der Prüfung ist Node.js 24.14.0 installiert.
Für diese Anleitung Node.js 24 und npm verwenden.

## Einrichtung

Alle folgenden Befehle im Ordner `backend/` ausführen:

```bash
npm ci
```

Falls noch keine `.env` vorhanden ist, `.env.example` nach `.env` kopieren.
Eine vorhandene `.env` mit eigenen Zugangsdaten beibehalten.

- `PORT`: optional, Standardwert `3000`.
- `DATABASE_URL`: PostgreSQL-Verbindungsadresse für Prisma und das Client-Modul. Die Vorlage enthält ausschließlich Beispieldaten; diese durch die eigene Verbindung ersetzen.
- Echte Zugangsdaten gehören nur in die lokale `.env`, nicht in Git oder Dokumentation.

Den Prisma-Client nach der ersten Installation und nach Schemaänderungen erzeugen:

```bash
npx prisma generate
```

Der Client wird aus `prisma/schema.prisma` unter `src/generated/prisma/` erzeugt und nicht versioniert.
Er ist für die Typprüfung und den Build des vorhandenen Client-Moduls erforderlich.
`prisma7.config.ts` lädt die `.env` über `dotenv`; für Prisma-Befehle muss `DATABASE_URL` gesetzt sein.

## Entwicklungsserver starten

```bash
npm run dev
```

Der Server startet standardmäßig auf Port 3000 und startet bei Codeänderungen neu.
Node.js lädt die `.env` beim Serverstart. Mit `Strg+C` beenden.
Der aktuelle Server verwendet den Prisma-Client noch nicht; die Statusroute funktioniert daher auch ohne Datenbankzugriff.

## Status prüfen

Im Browser oder in Postman `GET http://localhost:3000/api/health` aufrufen.
Erwartet werden HTTP 200 und:

```json
{ "status": "ok" }
```

Die Route prüft, ob der Server antwortet. Sie prüft keine Datenbank oder externen Dienste.
Unbekannte Adressen liefern HTTP 404 und `{ "error": "Route nicht gefunden." }`.
Die geplanten Meme-Endpunkte sind noch nicht implementiert.

## Prisma und Datenbank prüfen

```bash
npx prisma validate
npx prisma migrate status
```

- `validate` prüft das Prisma-Schema, ohne eine funktionierende Datenbankverbindung nachzuweisen.
- `migrate status` benötigt eine erreichbare PostgreSQL-Datenbank und vergleicht deren Migrationsstand mit den vorhandenen Migrationsdateien.
- Die erste Migration liegt unter `prisma/migrations/20261104125318_init/`. Ihre Existenz belegt nicht, dass sie bereits angewendet wurde.

Zum Einrichten einer neuen, leeren Projektdatenbank kann nach Prüfung von `DATABASE_URL` die vorhandene Migration angewendet werden:

```bash
npx prisma migrate deploy
```

Dieser Befehl verändert die ausgewählte Datenbank. Für eine bereits befüllte Datenbank zuerst den Migrationsstand klären.
Neue Schemaänderungen und Migrationen werden separat geplant; für den aktuellen Stand ist keine neue `init`-Migration nötig.

## TypeScript prüfen und JavaScript starten

Nach der Client-Generierung:

```bash
npm run typecheck
npm run build
npm start
```

- `typecheck`: prüft TypeScript, ohne JavaScript-Dateien zu erzeugen.
- `build`: übersetzt `src/` einschließlich des generierten Clients nach `dist/`.
- `start`: startet den zuvor gebauten Server. Nach Codeänderungen erneut bauen.
- Ein automatisiertes Testskript ist noch nicht eingerichtet. Typprüfung und Build ersetzen keine API- oder Datenbanktests.

## Struktur und Stand

| Pfad | Aufgabe |
| --- | --- |
| `src/server.ts` | Express-Anwendung, Statusroute, 404-Antwort und Serverstart |
| `src/lib/prisma.ts` | Prisma-Client mit PostgreSQL-Adapter; noch nicht im Server verwendet |
| `src/generated/prisma/` | Generierter Prisma-Client, nicht von Hand bearbeiten |
| `prisma/schema.prisma` | Sechs Modelle mit Beziehungen und Löschkaskaden |
| `prisma/migrations/` | Versionierte SQL-Migrationen und Provider-Lockdatei |
| `prisma7.config.ts` | Prisma-Konfiguration; wird von der installierten CLI erkannt |
| `tsconfig.json` | TypeScript-Einstellungen |
| `package.json`, `package-lock.json` | Skripte, Abhängigkeiten und festgehaltene Paketversionen |
| `.agents/skills/`, `skills-lock.json` | Installierte Hilfen für KI-Werkzeuge, kein Anwendungscode |
| `.claude/skills/`, `.windsurf/skills/` | Verknüpfungen auf diese Hilfen, keine zusätzlichen Kopien |
| `AGENTS.md` | Regeln für die Backend-Zusammenarbeit |
| `SPECK.md`, `docs/` | Anforderungen, Datenmodell, API-Plan und geprüfter Projektstand |

Clerk, Bildspeicher, fachliche Endpunkte und ihre Validierungs-, Berechtigungs- und Testlogik fehlen noch.
Details und offene Konfigurationspunkte: [Projektstand](docs/projektstand.md).

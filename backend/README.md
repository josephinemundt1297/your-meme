# Your Meme – Backend starten

Ein kleines Express-/TypeScript-Grundgerüst. Voraussetzung: Node.js ab 22.9 und npm.
Entwicklung und Prüfung erfolgen aktuell mit Node.js 24.

## Einrichtung

Alle folgenden Befehle im Ordner `backend/` ausführen:

```bash
npm install
npm run dev
```

Der Entwicklungsserver startet auf Port 3000 und startet bei Änderungen am Code neu.
Optional `.env.example` als `.env` kopieren und dort `PORT` ändern.
Node.js lädt diese Datei beim Start; echte Zugangsdaten gehören nicht in Git.

## Status prüfen

Im Browser oder in Postman `GET http://localhost:3000/api/health` aufrufen.
Erwartet werden HTTP 200 und:

```json
{ "status": "ok" }
```

Die Route zeigt nur, dass der Server antwortet. Sie prüft noch keine Datenbank oder externen Dienste.
Unbekannte Adressen liefern HTTP 404 und `{ "error": "Route nicht gefunden." }`.
Den Server im Terminal mit `Strg+C` beenden.

## TypeScript prüfen und JavaScript starten

```bash
npm run typecheck
npm run build
npm start
```

- `typecheck`: prüft TypeScript, ohne JavaScript-Dateien zu erzeugen.
- `build`: übersetzt `src/` nach `dist/`.
- `start`: startet den zuvor gebauten Server. Nach Codeänderungen erneut bauen.
- `src/server.ts`: Express-Anwendung, Statusroute und Serverstart.
- `tsconfig.json`: Einstellungen für die TypeScript-Übersetzung.
- `package-lock.json`: hält die installierten Paketversionen fest.

Noch nicht angebunden: PostgreSQL, Prisma, Clerk, Bildspeicher und fachliche Meme-Endpunkte.

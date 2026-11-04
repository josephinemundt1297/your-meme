# Your Meme – API-Plan (Entwurf)

Stand: 04.11.2026, mit `src/server.ts` abgeglichen. Die folgenden fünf Meme-Endpunkte sind geplant, noch nicht implementiert.
Die Formate für Anfragen und Antworten werden mit Dilek abgestimmt.

## Bereits implementiert

### GET /api/health – Serverstatus abrufen

- Öffentlich zugänglich.
- HTTP 200 mit `{ "status": "ok" }`.
- Prüft ausschließlich, ob der Express-Server antwortet; keine Datenbank- oder Clerk-Prüfung.

Unbekannte Routen liefern HTTP 404 mit `{ "error": "Route nicht gefunden." }`.
Das gilt derzeit auch für alle unten geplanten Meme-Endpunkte.

## Geplante Meme-Endpunkte

### GET /api/memes – Meme-Liste abrufen

- Öffentlich zugänglich
- Seitenweise laden; `?page=1&limit=20` ist ein Beispiel, noch kein abgestimmter Vertrag. Standardwerte und maximale Seitengröße sind noch festzulegen.

### GET /api/memes/:id – Ein bestimmtes Meme abrufen

- Öffentlich zugänglich

### POST /api/memes – Meme mit Bild und Titel hochladen

- Anmeldung erforderlich
- Ersteller wird aus dem geprüften Clerk-Login ermittelt

### PATCH /api/memes/:id – Eigenes Meme bearbeiten

- Nur für den Ersteller

### DELETE /api/memes/:id – Meme löschen

- Für den Ersteller oder einen Administrator

## Noch zu planen

- Genaue Daten für Anfragen, Antworten und Fehler festlegen.
- Endpunkte für Kommentare, Likes, persönliche Ordner und die eigene Kontolöschung ergänzen.
- Bei geschützten Anfragen Clerk-Identität und Zugriffsrechte prüfen.
- Teilen erfolgt zunächst über einen Link; dafür ist kein eigener API-Endpunkt geplant.
- Die Arbeit findet auf der Trello-Karte „Datenaustausch zwischen Frontend und Backend festlegen“ statt.

Aktueller Stand und Reihenfolge: [projektstand.md](projektstand.md).

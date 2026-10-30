# Your Meme – API-Plan (Entwurf)

Stand: 30.10.2026. Bisher sind die folgenden fünf Meme-Endpunkte geplant, noch nicht implementiert.
Die Formate für Anfragen und Antworten werden mit Dilek abgestimmt.

## Geplante Meme-Endpunkte

### GET /api/memes – Meme-Liste abrufen

- Öffentlich zugänglich
- Seitenweise laden, beispielsweise mit ?page=1&limit=20

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

GET /api/memes- Meme-Liste abrufen

- Öffentlich zugänglich
- Seitenweise laden, beispielsweise mit ?page=1&limit=20

GET /api/memes/:id- Ein bestimmtes Meme abrufen

- Öffentlich zugänglich

POST /api/memes- Meme mit Bild und Titel hochladen

- Anmeldung erforderlich
- Ersteller wird aus dem geprüften Clerk-Login ermittelt

PATCH /api/memes/:id- Eigenes Meme bearbeiten

- Nur für den Ersteller

DELETE /api/memes/:id- Meme löschen

- Für den Ersteller oder einen Administrator

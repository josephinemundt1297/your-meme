# Your Meme

Fullstack-Abschlussprojekt einer Meme-Plattform, umgesetzt von zwei Personen.

## Bereiche

- `frontend/`: bestehendes React-Projekt mit TypeScript und Vite; Schwerpunkt Dilek.
- `backend/`: Express-/TypeScript-Grundgerüst und Backend-Planung; PostgreSQL, Prisma und Clerk folgen.
- [Backend-Spezifikation](backend/SPECK.md)
- [Datenmodell](backend/docs/datenmodell.md)
- [API-Plan](backend/docs/api-plan.md)
- [Geprüfter Projektstand und Trello-Arbeitsweise](backend/docs/projektstand.md)
- [Hand-out für die Besprechung am 30.10.2026](backend/docs/handout-2026-10-30.md)
- [Trello-Board](https://trello.com/b/EpjAfv15/your-meme)

## Frontend starten

Im Ordner `frontend/` die Abhängigkeiten mit `npm install` installieren und anschließend `npm run dev` ausführen.

## Backend

Im Ordner `backend/` die Abhängigkeiten mit `npm install` installieren und anschließend `npm run dev` ausführen.
Die Statusroute ist unter `http://localhost:3000/api/health` erreichbar.
Weitere Befehle und Erklärungen stehen in der [Backend-Startanleitung](backend/README.md).
Das Grundgerüst enthält noch keine Datenbank, Anmeldung oder Meme-Endpunkte.
Die Regeln in `backend/AGENTS.md` gelten ausschließlich für den Backend-Bereich.
Frontend-Regeln können unabhängig unter `frontend/AGENTS.md` ergänzt werden.

## Vorhandene Git-Branches

- `Backend`: Josephines Arbeitsbranch.
- `Frontend`: Dileks Arbeitsbranch.
- `main`: gemeinsamer Hauptbranch.

Ein Branch ist ein Entwicklungsstand des gesamten Repositorys, kein Ordner.
Die Branches existieren bereits; sie müssen nicht neu erstellt werden.
Änderungen erst nach gegenseitiger Prüfung und ausdrücklicher Freigabe zusammenführen.

Abgabe: 23.11.2026. Deployment ist freiwillig; eine Präsentation auf localhost ist zulässig.

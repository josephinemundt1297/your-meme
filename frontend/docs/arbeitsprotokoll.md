# Arbeitsprotokoll – Frontend

Dieses Protokoll dokumentiert Dileks Frontend-Arbeiten für das Projekt **Your Meme**.

## 29.10.2026 – Projektstart und Planung

- Frontend- und Backend-Zuständigkeiten festgelegt.
- Dilek übernimmt das Frontend, Josi übernimmt das Backend.
- Die Meme-Seite als gemeinsames Projektthema festgelegt.
- Vorgehen mit eigenen Branches und Pull Requests abgestimmt.

## 30.10.2026 – Frontend-Grundstruktur

- Frontend-Bereich im Ordner `frontend/` eingerichtet.
- React-, TypeScript- und Vite-Grundlage verwendet.
- Klare Trennung zwischen Frontend und Josis Backend festgelegt.
- Erste Ordner- und Komponentenstruktur angelegt.
- Beispieldaten ohne Backend-Abhängigkeit erstellt.

## 30.10.2026 – Erste Meme-Oberfläche

- Header und Navigation erstellt.
- Seitenleiste für Kategorien und persönliche Ordner vorbereitet.
- Meme-Übersicht mit statischen Meme-Karten umgesetzt.
- Suchfeld ergänzt.
- Like-Buttons mit funktionierendem lokalen Zustand ergänzt.
- Responsive Darstellung für Desktop, Tablet und Handy umgesetzt.
- Fokus-Styling und barrierearme Beschriftungen ergänzt.
- Kategorien erweitert, unter anderem Sport, Gaming, Tech, Animal, Movies, Outdoor, Study, Drinks, Food, Holiday, Book und Meeting.

## 02.11.2026 – Layout und Seiten

- Meme-Detailseite für bekannte Meme-IDs erstellt.
- Meldung für unbekannte Meme-IDs ergänzt.
- Upload-Formular als Frontend-Demo erstellt.
- Meme-Mock-up und responsive Meme-Grid umgesetzt.
- Lade- und leere Zustände ergänzt.
- Navigation und Kategorien erweitert.

## 03.11.2026 – Qualität und Seitenstruktur

- Router-Konfiguration und React-Komponenten getrennt.
- Leere Platzhalterdateien entfernt.
- TypeScript-Typen für Meme-Daten und Komponenten geprüft und verbessert.
- Mobile Navigation mit Öffnen-/Schließen-Funktion umgesetzt.
- Tastaturbedienung, sichtbarer Fokus und passende ARIA-Zustände geprüft.
- `npm run lint` und `npm run build` erfolgreich ausgeführt.

## 04.11.2026 – Clerk und Authentifizierung

- Clerk-Anwendung für **Your Meme** eingerichtet.
- Clerk im React-Frontend integriert.
- Anmeldung und Registrierung auf `/account` ergänzt.
- Umschaltung zwischen Anmelden und Registrieren umgesetzt.
- Benutzer-Button für angemeldete Nutzer ergänzt.
- Clerk-Publishable-Key lokal in `.env.local` hinterlegt.
- `npm run lint` und `npm run build` erfolgreich ausgeführt.
- Commit und Push auf den Branch `Frontend`:
  - `294c51e feat(frontend): add Clerk authentication`

## 05.11.2026 – Vorbereitung für echte API-Daten

- Clerk-Anmeldung und Navigation erneut geprüft.
- Typisierten API-Client für den geplanten Endpoint `/api/memes` erstellt.
- API-Client verwendet den vorhandenen `Meme`-Type.
- Fehler bei fehlgeschlagenen oder ungültigen API-Antworten werden erkannt.
- Lade-, Leer-, Fehler- und „Meme nicht gefunden“-Zustände geprüft.
- `npm run lint` und `npm run build` erfolgreich ausgeführt.
- Commit und Push auf den Branch `Frontend`:
  - `ab6fe0c feat(frontend): prepare typed meme api client`

## Offene Punkte

- Josis Backend-Endpoint `/api/memes` ist noch nicht erreichbar.
- Echte Meme-Daten aus PostgreSQL müssen noch angebunden werden.
- Danach müssen die API-Daten in der Meme-Liste angezeigt und getestet werden.
- Weitere gemeinsame Themen sind Clerk-Absicherung im Backend, Bild-Uploads, Likes, Kommentare und persönliche Ordner.

## Zuständigkeiten

- **Dilek:** React-Frontend, Layout, Navigation, Authentifizierungsoberfläche und API-Anbindung im Frontend.
- **Josi:** Express-/TypeScript-Backend, PostgreSQL/Prisma, API-Endpunkte und Backend-Authentifizierung.

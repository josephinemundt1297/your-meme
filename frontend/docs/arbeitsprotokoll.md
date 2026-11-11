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

## 09.11.2026 – Echte Meme-Daten und Detailseite

- Den vorhandenen typisierten API-Client mit `/api/memes` verbunden.
- Echte Meme-Daten aus PostgreSQL in der Übersicht angezeigt.
- Echte Meme-Bilder über `imageUrl` angezeigt.
- Beim Anklicken eines Memes wird die Detailseite über `/api/memes/:id` geladen.
- Für unbekannte Meme-IDs wird eine verständliche Meldung angezeigt.
- Backend-Testdaten und erreichbare Bildadressen gemeinsam mit Josi geprüft.
- Commit und Push auf den Branch `Frontend`:
  - `5002df3 feat: load meme details from api`

## 10.11.2026 – Kommentare vorbereiten und anzeigen

- Vorhandenen Endpoint `/api/memes/:id/comments` im Frontend angebunden.
- Kommentare auf der Meme-Detailseite typisiert dargestellt.
- Lade-, Fehler- und Leerzustand für Kommentare ergänzt.
- Bei leerer Antwort wird „Noch keine Kommentare.“ angezeigt.
- `npm run lint`, `npm run build` und die Detailseite geprüft.
- Commit und Push auf den Branch `Frontend`:
  - `b3b3743 feat: show comments on meme detail pages`

## 11.11.2026 – Kategorien und Abschlussprüfung

- Geprüft, wie Kategorien aus den Backend-Daten im Frontend behandelt werden.
- Festgestellt: Das Backend liefert aktuell noch kein Kategorie-Feld; deshalb wird teilweise `Community` angezeigt.
- Keine irreführende Änderung im Frontend vorgenommen, da die Kategorie-Struktur zuerst mit Josi abgestimmt werden muss.
- Startseite und Detailseite im Browser geprüft.
- `npm run lint` erfolgreich ausgeführt.
- `npm run build` erfolgreich ausgeführt.
- Git-Status geprüft: Branch `Frontend` ist sauber.

## Offene Punkte und Warten auf Josi

- Josi muss das Kategorie-Feld im Backend-Datenmodell und in den API-Antworten ergänzen oder bestätigen, wie Kategorien umgesetzt werden sollen.
- Danach muss das Frontend die echten Kategorien statt des Fallbacks `Community` anzeigen und filtern.
- Kommentare sind technisch vorbereitet; echte Kommentare müssen noch im Backend/Testdatenbestand vorhanden sein.
- Clerk muss im Backend abgesichert und mit dem Frontend abgestimmt werden.
- Bild-Uploads, Likes und persönliche Ordner sind noch gemeinsame nächste Ausbauschritte.
- Für die weitere API-Prüfung müssen Backend, PostgreSQL und Josis Testdaten lokal laufen.

## Zuständigkeiten

- **Dilek:** React-Frontend, Layout, Navigation, Authentifizierungsoberfläche und API-Anbindung im Frontend.
- **Josi:** Express-/TypeScript-Backend, PostgreSQL/Prisma, API-Endpunkte und Backend-Authentifizierung.

# Your Meme

**Fullstack-Abschlussprojekt von Dilek (Frontend) und Josephine (Backend)**  
**Dokumentationsstand:** 19.11.2026 · **Abgabe:** 20.11.2026

Your Meme ist eine Webanwendung zum Teilen und Organisieren von Memes. Angemeldete Nutzerinnen und Nutzer können eigene PNG-Bilder hochladen, Memes kategorisieren, liken, kommentieren und in persönlichen Ordnern sammeln. Die Anwendung verbindet ein React-Frontend mit einer eigenständigen REST-API, PostgreSQL als Datenbank, Clerk für die Anmeldung und Cloudinary als Bildspeicher.

> **Projektstatus:** Die Kernfunktionen sind implementiert und wesentliche Abläufe wurden lokal geprüft. Die Anwendung befindet sich noch in der Abschlussabnahme; insbesondere sind nicht sämtliche Frontend-Aktionen und betrieblichen Datenschutzprozesse fertiggestellt.

## Technologie und Architektur

| Bereich           | Technologien                                | Verantwortung        |
| ----------------- | ------------------------------------------- | -------------------- |
| Frontend          | React 19, TypeScript, Vite, TanStack Router | Dilek                |
| Backend           | Node.js 24, Express 5, TypeScript, Zod      | Josephine            |
| Persistenz        | PostgreSQL (Neon), Prisma 7                 | Backend              |
| Authentifizierung | Clerk                                       | Frontend und Backend |
| Bildspeicher      | Cloudinary                                  | Backend              |

```text
Browser / React
   |  Clerk-Session-Token für geschützte Anfragen
   v
Express REST-API (Port 3000)
   |-- Clerk: Authentifizierung und Nutzerzuordnung
   |-- Prisma: Profile, Memes, Kommentare, Likes und Ordner
   |      `-- PostgreSQL (Neon)
   `-- Cloudinary: PNG-Upload und Bildlöschung
```

Das Frontend kommuniziert über HTTP mit dem Backend. Die API prüft geschützte Aktionen serverseitig; die bloße Sichtbarkeit einer Schaltfläche im Frontend stellt keine Berechtigung dar. Bilder werden bei Cloudinary gespeichert, ihre URLs und Speicherkennungen in PostgreSQL referenziert.

Weitere technische Details: [Backend-Architektur](backend/docs/architektur.md), [Datenmodell](backend/docs/datenmodell.md) und [API-Vertrag](backend/docs/api-plan.md).

## Funktionsumfang

| Bereich                      | Backend                                                    | Frontend / Abnahme                                                            |
| ---------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Anmeldung und lokales Profil | Clerk-Authentifizierung, Profilsynchronisierung            | Login im Browser geprüft                                                      |
| Memes                        | Upload, Liste, Detail, Titel-/Kategorieänderung, Löschung  | Upload, Anzeige und eigene Löschung im Browser geprüft                        |
| Kategorien                   | Validierung und Filterung vor Pagination                   | API-Filter geprüft; vollständige UI-Abnahme offen                             |
| Likes                        | Setzen, Entfernen und persönlicher Like-Status             | Like/Unlike inklusive Neuladen geprüft                                        |
| Kommentare                   | Erstellen, Bearbeiten, Löschen mit Berechtigungsprüfung    | Erstellen/Anzeigen geprüft; Bearbeiten/Löschen in der UI noch nicht verfügbar |
| Persönliche Ordner           | Erstellen, Anzeigen, Umbenennen, Löschen; Meme-Zuordnungen | Ordnererstellung und Zuordnung im Browser geprüft                             |
| Moderation                   | Administrator-Löschrechte für Memes und Kommentare         | Backend-seitig getestet; keine vollständige Admin-UI-Abnahme                  |
| Pagination                   | Meme-Liste mit `page`, `limit` und Seiten-Headern          | HTTP geprüft; vollständiges Nachladen im Frontend offen                       |

**Unterstützte Kategorien:** Arbeit, Programmieren, Kaffee, Tiere, Essen, Lernen, Spiele, Zuhause, Wochenende und Ohne Kategorie. Ohne Filter werden Memes aller Kategorien abgefragt; unbekannte Kategorien führen zu HTTP 400.

**Berechtigungen:** Schreibaktionen setzen eine gültige Clerk-Session und ein synchronisiertes lokales Profil voraus. Eigentümerrechte werden im Backend geprüft. Das Verhalten mit zwei Konten wurde für eigene und fremde Meme-Aktionen im Browser nachvollzogen; automatisierte Tests decken zusätzliche Autorisierungsfälle ab.

## Lokale Entwicklung

### Voraussetzungen

- Node.js **24 oder neuer** und npm
- Zugriff auf die vereinbarte PostgreSQL-Projektdatenbank
- Clerk-Anwendung mit Backend- und Frontend-Schlüsseln
- Cloudinary-Zugangsdaten für Bild-Uploads und -Löschung

Frontend und Backend werden in **zwei separaten Terminals** gestartet. Die Umgebungsdateien sind lokal anzulegen und dürfen keine echten Geheimnisse im Git-Repository enthalten.

### 1. Backend starten

Im Verzeichnis `backend/`:

```bash
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate status
npm run dev
```

Die Backend-Konfiguration liegt in `backend/.env`. Die erforderlichen Variablen und ihre Bedeutung stehen in der [Backend-Startanleitung](backend/README.md); dazu gehören `DATABASE_URL`, die Clerk-Schlüssel und die Cloudinary-Zugangsdaten.

**Achtung bei der gemeinsamen Datenbank:** `prisma migrate status` prüft nur den Migrationsstand. `prisma migrate deploy` und Testdatenimporte verändern die konfigurierte Datenbank und dürfen nicht ohne vorherige Abstimmung auf der gemeinsamen Neon-Datenbank ausgeführt werden. Für eine neue, getrennte Entwicklungsdatenbank gelten die Schritte in der [Datenbank-Dokumentation](backend/docs/gemeinsame-datenbank.md).

Standardmäßige Endpunkte:

| URL                                   | Zweck                      |
| ------------------------------------- | -------------------------- |
| `http://localhost:3000/api/health`    | Erreichbarkeit des Servers |
| `http://localhost:3000/api/health/db` | Datenbankverbindung        |
| `http://localhost:3000/api/memes`     | Öffentliche Meme-Liste     |

### 2. Frontend starten

Im Verzeichnis `frontend/`:

```bash
npm ci
npm run dev
```

Die Datei `frontend/.env.local` benötigt mindestens:

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
VITE_API_URL=http://localhost:3000
```

Frontend und Backend müssen dieselbe Clerk-Anwendung verwenden. Der **Clerk Secret Key** gehört ausschließlich ins Backend, niemals in eine `VITE_*`-Variable.

Das Frontend ist normalerweise unter `http://localhost:5173/` erreichbar. Bei einem abweichenden Port muss die Backend-CORS-Konfiguration passen. Nach Änderungen an Umgebungsvariablen die jeweiligen Entwicklungsserver neu starten.

## API-Konventionen

- Die REST-API ist unter `/api` erreichbar.
- Geschützte Endpunkte erwarten `Authorization: Bearer <SESSION_TOKEN>`.
- Vor personenbezogenen Schreibaktionen muss das lokale Profil über `POST /api/me/sync` synchronisiert sein.
- Der Meme-Upload erfolgt als `multipart/form-data` mit `title`, `image` und optional `category`; zugelassen ist **ein PNG bis 5 MiB**.
- Die Meme-Liste unterstützt `page`, `limit` und `category`; `X-Page`, `X-Limit` und `X-Has-More` beschreiben die Seite.
- Fehler werden über definierte HTTP-Statuscodes und sichere JSON-Antworten behandelt.
- API- und Schreibanfragen sowie Uploads sind durch prozesslokale Rate-Limits begrenzt.

Vollständige Endpunktdefinitionen, Felder, Rechte und Statuscodes: [API-Vertrag](backend/docs/api-plan.md).

## Qualitätssicherung

### Backend – bestätigter Prüfstand vom 19.11.2026

| Prüfung               | Ergebnis                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `npm run typecheck`   | Erfolgreich                                                                         |
| `npm run build`       | Erfolgreich                                                                         |
| `npx prisma validate` | Erfolgreich mit lokal konsistenter Prisma-7-Installation                            |
| `npm test`            | **105 bestanden, 2 optionale PostgreSQL-Tests übersprungen**                        |
| `GET /api/health`     | HTTP 200                                                                            |
| `GET /api/health/db`  | HTTP 200, Datenbank verbunden                                                       |
| Kategorienfilter      | Gültige Kategorie HTTP 200, ungültige Kategorie HTTP 400                            |
| Pagination            | HTTP 200, Seiten-Header geprüft                                                     |
| Browserintegration    | Anmeldung, Upload, Like/Unlike, Kommentare, Ordner und eigene Meme-Löschung geprüft |
| Persistenz            | Meme-Anlage und -Löschung in Prisma Studio nachvollzogen                            |

Backend-Prüfungen im Verzeichnis `backend/`:

```bash
npm run typecheck
npm test
npm run build
npx prisma validate
```

Die zwei standardmäßig übersprungenen PostgreSQL-Integrationstests benötigen eine **getrennte lokale Testdatenbank**. Die Testanleitung und Sicherheitsbedingungen stehen in [backend/README.md](backend/README.md). Simulierte Dienste in automatisierten Tests sind kein Nachweis für die vollständige Integration mit Clerk, Cloudinary und Neon.

Frontend-Prüfungen im Verzeichnis `frontend/`:

```bash
npm run lint
npm run build
```

Für diese Frontend-Befehle wird hier **kein neuer erfolgreicher Lauf vom 19.11.2026 behauptet**.

## Bekannte Einschränkungen und offene Abnahme

- **Kontolöschung:** Ein vollständiger Ablauf zum Löschen eines Nutzerkontos und aller zugehörigen Daten fehlt.
- **Kommentaraktionen im Frontend:** Eigene Kommentare können backendseitig bearbeitet und gelöscht werden; entsprechende UI-Aktionen fehlen noch.
- **Listen und Sortierung:** Kommentar- und Ordnerlisten sind nicht paginiert. Die vollständige Feed-Pagination und Sortierung im Frontend benötigen weitere Prüfung.
- **Bildlöschung:** Das Backend verwaltet persistente Bereinigungsaufträge für Cloudinary. Die externe Löschung wurde am 19.11. nicht unabhängig Ende-zu-Ende verifiziert; mögliche Verzögerungen und Fehler sind in der [Bildlöschungs-Dokumentation](backend/docs/bildloeschung.md) beschrieben.
- **Betrieb und Datenschutz:** Backup-/Aufbewahrungsfristen, vollständige DSGVO-Abnahme und produktive Betriebsbedingungen sind nicht abschließend geklärt.
- **Abschlussabnahme:** Eine vollständige gemeinsame Browser-, Berechtigungs- und Responsive-Abnahme steht noch aus.

Diese Einschränkungen sind bewusst dokumentiert und nicht mit einer pauschalen Fertigstellungsquote gleichzusetzen.

## Projektunterlagen

- [Backend-Startanleitung](backend/README.md)
- [Frontend-Startanleitung](frontend/README.md)
- [Backend-Spezifikation](backend/SPECK.md)
- [API-Vertrag](backend/docs/api-plan.md)
- [Architektur](backend/docs/architektur.md)
- [Datenmodell](backend/docs/datenmodell.md)
- [Projektstand und Prüfbelege](backend/docs/projektstand.md)
- [Bildlöschung](backend/docs/bildloeschung.md)
- [Gemeinsame Datenbank](backend/docs/gemeinsame-datenbank.md)
- [Trello-Board](https://trello.com/b/EpjAfv15/your-meme)

## Zusammenarbeit und Versionsverwaltung

Dilek verantwortet das Frontend, Josephine das Backend und die Backend-Dokumentation. Die Entwicklung erfolgt in den Branches `Frontend` und `Backend`; der abgestimmte Integrationsstand wird in `main` zusammengeführt.

**Diese README wird auf dem Branch `Backend` gepflegt.** Ein Merge nach `main` erfolgt erst nach gemeinsamer Prüfung. Historische Zwischenberichte bleiben als zeitbezogene Nachweise erhalten; für den aktuellen Funktionsumfang sind die vorstehenden Abschnitte und die verlinkten Fachdokumente maßgeblich.

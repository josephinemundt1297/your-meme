# Your Meme – Frontend

Stand: 12.11.2026. Gemeinsamer Code in main und lokalem Backend-Branch: `1ff7cba`; Frontend-Branch `01bc9bc` ist darin enthalten. React, TypeScript, Vite, TanStack Router und Clerk.

## Lokal starten

Node.js 24/npm verwenden. Im Ordner frontend:

```bash
npm ci
```

Eigene .env.local einrichten, bestehende Werte nicht überschreiben:

```env
VITE_CLERK_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
VITE_API_URL=http://localhost:3000
```

Dieselbe Clerk-Anwendung wie im Backend verwenden. Secret Keys gehören ausschließlich ins Backend. Danach:

```bash
npm run dev
```

Die angezeigte Adresse öffnen, normalerweise http://localhost:5173/. Backend/PostgreSQL laufen separat, API auf Port 3000. Webseite /memes/ID liefert HTML; API /api/memes/ID auf Port 3000 liefert JSON. [Backend und Bild-Testdaten einrichten](../backend/README.md). Dileks Protokoll meldet fehlende lokale Cloudinary-Variablen; alle drei Backend-Werte lokal ergänzen, keine Secrets ins Frontend oder Git.

## Bereits implementiert

- Layout, Navigation, responsive Styles, Clerk-Anmelden/Registrieren/Benutzer-Button.
- API-Übersicht, Detail und Kommentar-Liste mit Lade-/Leer-/Fehlerzuständen.
- PNG-Upload bis 5 MiB mit Bearer-Token, FormData title/image, abgewartetem Benutzer-Sync, Fehlermeldungen, deaktiviertem Button während Upload und Weiterleitung zur neuen Detailseite.
- Kommentarformular für angemeldete Nutzer: getrimmt 1–1000 Zeichen, POST mit Token, während Anfrage deaktiviert, Erfolg lokal ergänzen und Zähler aktualisieren, Text bei Fehler behalten.
- Like/Unlike in Liste und Detail über API, Antworten liked/likeCount übernehmen, keine lokale Zusatz-Zählung. Detailbutton während Anfrage deaktiviert; Listenkarten noch ohne Sperre.

Josephine bestätigt den Browser-Upload bis Cloudinary. Dileks Protokoll bestätigt Code und statische Prüfungen, nennt aber noch keine abgeschlossene vollständige Browser-Abnahme für Kommentare und Likes.

## Priorisierte Restarbeit

1. **Token auch bei GET:** fetchMemes und fetchMemeById haben noch keinen Authorization-Header. Backend liefert inzwischen likedByMe, benötigt dafür aber erkannte Anmeldung. Nach Login/Logout/Kontowechsel Daten erneut laden, damit keine alten persönlichen Zustände sichtbar bleiben.
2. **Autor:** API-author übernehmen; normalizeMeme setzt noch Community.
3. **Erstlogin und Mehrfachklicks:** Layout-Sync verschluckt Fehler; Kommentare/Likes warten nicht ausdrücklich darauf. Ohne vorherigen Upload testen. Listen-Likes gegen gleichzeitige Anfragen sperren. Kommentar-Liste nach POST auch bei vorherigem Ladefehler/parallel laufendem GET konsistent halten.
4. **Eigene Inhalte:** Meme-Titel ändern/löschen und eigene Kommentare bearbeiten/löschen anbinden. Lokale Nutzer-ID aus Sync verfügbar machen (nicht mit Clerk-ID verwechseln). Bei 204 keinen JSON-Body lesen.
5. **Ordner:** Backend kann jetzt erstellen/laden/speichern/Zuordnung entfernen. Oberfläche und Seitenleiste anbinden; Umbenennen und ganzen Ordner löschen fehlen im Backend noch. Ordner-Memes haben noch kein likedByMe.
6. Sichtbaren Link nach /upload ergänzen. Vorschau-Object-URLs freigeben. Handy, Tastatur, Kontraste und Bildbeschreibungen praktisch prüfen; vorhandene ARIA/alt-Attribute belegen keine vollständige Barrierefreiheit.
7. Moderation und Kontolöschung benötigen weitere Backend-Routen und entsprechende Oberflächen. Kategorien/Suche/Editor sind kein zusätzlicher Pflichtumfang.

[API-Vertrag](../backend/docs/api-plan.md) enthält Methoden, Felder und Fehler. Vorhandenes Kommentarformular und Like-Aktionen nicht als neue Aufgaben erneut bauen.

## Prüfungen und Zusammenarbeit

```bash
npm run lint
npm run build
```

Beide am 12.11.2026 erfolgreich. Kein Ersatz für echte Browser-/Rechtetests. [Arbeitsprotokoll](docs/arbeitsprotokoll.md) · [Projektstand](../backend/docs/projektstand.md) · [Trello](https://trello.com/b/EpjAfv15/your-meme).

Auf eigenem Frontend-Branch arbeiten; lokale Arbeit vor Zusammenführen sichern. Git überträgt keine lokalen Datenbankinhalte. Keine eigenständigen Commits/Pushes/Merges durch diese Dokumentationspflege.

# Your Meme – Frontend

Stand: 11.11.2026. React, TypeScript, Vite, TanStack Router und Clerk. Geprüfter veröffentlichter Frontend-Stand: `4b9947e`; gemeinsamer API-Stand in main laut Abgleich `9990879`. Unveröffentlichte Änderungen sind nicht bewertet.

## Lokal starten

Node.js 24 und npm verwenden. Im Ordner `frontend/`:

```bash
npm ci
```

Eigene `.env.local` anlegen, eine vorhandene nicht überschreiben:

```env
VITE_CLERK_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
VITE_API_URL=http://localhost:3000
```

Publishable Key derselben Clerk-Anwendung wie im Backend verwenden. Secret Keys gehören ausschließlich ins Backend. Danach:

```bash
npm run dev
```

Normalerweise `http://localhost:5173/` öffnen, nicht `/api/memes`. Bei anderem Port Backend-CORS abstimmen. Backend und PostgreSQL laufen separat; [Einrichtung und Testdaten](../backend/README.md). Nach Env-Änderungen neu starten. Git überträgt keine lokalen Datenbankinhalte.

## Was bereits funktioniert

- Layout, Navigation, responsive Styles, Clerk-Anmelden/Registrieren und Benutzer-Button.
- Übersicht und Detail laden Memes über die API; Kommentar-Liste lädt echte Daten.
- Lade-, Fehler-, Leer- und Nicht-gefunden-Zustände.
- Sortierung und lokale Textsuche vorhanden; Kategorienfilter ist nicht fertig. Suche/Kategorien sind kein zusätzlicher Pflichtumfang.

## API-Anbindung und nächste Schritte

1. Im gepushten Branch `4b9947e` ruft das Layout nach Anmeldung `/api/me/sync` mit Token auf. Sync-Fehler werden noch verschluckt, Upload wartet nicht auf Sync: vor Abnahme Erstlogin absichern. Lokale UUID aus Sync für eigene Inhalte verfügbar machen.
2. Echter PNG-Upload ist implementiert: FormData title/image, maximal 5 MiB, Bearer-Token, Upload-Button während Anfrage deaktiviert, Kategorie entfernt, Navigation zur zurückgegebenen Meme-ID. Browser-Test gegen aktuellen Backend-Stand noch gemeinsam durchführen.
3. Meme-Titel bearbeiten/eigene Memes löschen; Kommentarformular und eigene Kommentar-Aktionen ergänzen. Bei 204 keinen JSON-Body lesen.
4. Likes per POST/DELETE anbinden, `liked` und `likeCount` aus Antwort übernehmen. Persönlicher Like-Status nach Neuladen fehlt noch im Backend-Lesevertrag; gemeinsam ergänzen. Lokale Zusatz-Zählung dann ersetzen.
5. Gelieferten Meme-`author` übernehmen; der Client setzt bisher Community. Private Ordner, Moderation und Kontolöschung sind noch nicht angebunden und benötigen weitere Backend-Endpunkte.

Alle geschützten Anfragen: `Authorization: Bearer <aktueller Session-Token>`. Die konkreten Pfade, JSON-Formate und Fehler stehen im [API-Vertrag](../backend/docs/api-plan.md).

Das Uploadformular ist im gepushten Branch angebunden; Listen-Likes bleiben lokal. Detail-Like-Button hat noch keine Aktion; Ordnerseite ist ein Platzhalter. Vorschau-Object-URLs werden noch nicht freigegeben. Vor Abnahme Tastatur, Kontraste, Bildbeschreibungen und mobile Darstellung praktisch prüfen; vorhandene ARIA-/alt-Attribute allein belegen keine vollständige Barrierefreiheit.

## Prüfungen und Zusammenarbeit

```bash
npm run lint
npm run build
```

Beide am 11.11. auch mit den neuen Upload-Dateien in einer isolierten Prüfkopie erfolgreich; dies ersetzt keine Browser-/Integrationstests. [Arbeitsprotokoll](docs/arbeitsprotokoll.md) dokumentiert Dileks Arbeiten, [Projektstand](../backend/docs/projektstand.md) den gemeinsamen kritischen Abgleich.

Auf eigenem Frontend-Branch arbeiten. Vor einem Merge lokale Arbeit committen; aktuelle main-Änderungen können dort mit `git pull --no-rebase origin main` übernommen werden. Bei Konflikten betroffene Änderungen gemeinsam prüfen.

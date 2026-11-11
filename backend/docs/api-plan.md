# Your Meme – API: Implementierung und Planung

Stand: 11.11.2026, nach Meme-, Kommentar- und Like-Schreibfunktionen; mit `src/server.ts` abgeglichen.

Basis: `http://localhost:3000`. CORS: `http://localhost:5173`. Geschützte Anfragen: `Authorization: Bearer <SESSION_TOKEN>`. Kein Clerk Secret Key als Nutzer-Token. Browser-Anmeldung wird nicht automatisch an Postman übertragen.

## Implementierte Endpunkte

| Methode und Pfad | Zugriff | Erfolg und wichtige Fehler |
| --- | --- | --- |
| GET /api/health | Öffentlich | 200 `{ "status": "ok" }` |
| GET /api/health/db | Öffentlich | 200 connected; bei DB-Ausfall 503 disconnected |
| GET /api/memes | Öffentlich | 200 Array, neueste zuerst; noch unbegrenzt |
| GET /api/memes/:id | Öffentlich | 200 Meme; ungültige ID 400, fehlendes Meme 404 |
| GET /api/memes/:id/comments | Öffentlich | 200 Array, älteste zuerst; ID 400, Meme fehlt 404 |
| GET /api/me | Angemeldet | 200 `{ "clerkId": "user_BEISPIEL" }`; 401 |
| POST /api/me/sync | Angemeldet | Ohne Body; 200 lokales Profil; 401/500 |
| POST /api/memes | Angemeldet + lokales Profil | Multipart; 201 Meme; 400/401/409/413/500 |
| PATCH /api/memes/:id | Nur Ersteller | JSON title; 200 Meme; 400/401/403/404/500 |
| DELETE /api/memes/:id | Nur Ersteller | Ohne Body; 204 leer; 400/401/403/404/500 |
| POST /api/memes/:id/comments | Angemeldet + lokales Profil | JSON content; 201 Kommentar; 400/401/404/409/500 |
| PATCH /api/comments/:id | Nur Verfasser | JSON content; 200 Kommentar; 400/401/403/404/500 |
| DELETE /api/comments/:id | Nur Verfasser | Ohne Body; 204 leer; 400/401/403/404/500 |
| POST /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |
| DELETE /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |

Unbekannte Routen: 404 `{ "error": "Route nicht gefunden." }`. Geschützte Routen prüfen zuerst Anmeldung; deshalb kann ohne Token auch bei ungültiger ID zunächst 401 kommen. `:id` durch die tatsächliche jeweilige UUID ersetzen. Kommentare verwenden bei PATCH/DELETE die Kommentar-ID, nicht die Meme-ID. Ressourcenrennen zwischen Lesen und Schreiben können derzeit in generischem 500 enden.

## Antwortformate

Die folgenden IDs, Namen und Bildadresse sind Beispiele, keine echten Zugangsdaten oder garantierten Testressourcen.

Meme (Liste enthält ein Array dieser Objekte, GET-Detail und Meme-POST/PATCH ein einzelnes):

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "title": "Beispiel-Meme",
  "imageUrl": "https://bilder.example/meme.png",
  "userId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-11-11T09:00:00.000Z",
  "author": {
    "id": "22222222-2222-4222-8222-222222222222",
    "username": "Beispielnutzer"
  },
  "likeCount": 0,
  "commentCount": 0
}
```

Aktuell kein `category`, `likedByMe`, `altText`, `emoji` oder `imageStorageId` in öffentlichen Meme-Antworten. `userId` und `author.id` sind lokale UUIDs; `GET /api/me` liefert dagegen die Clerk-ID. Für eigene Schaltflächen die lokale ID aus `/api/me/sync` verwenden. Das Backend prüft Rechte unabhängig von der Oberfläche. Der Frontend-Client ersetzt `author` noch durch Community; das ist offen.

Kommentar (GET-Liste als Array, POST/PATCH als einzelnes Objekt):

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "content": "Beispielkommentar",
  "userId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-11-11T09:05:00.000Z",
  "user": { "username": "Beispielnutzer" }
}
```

Leere Listen: `[]`. DELETE mit 204 hat keinen JSON-Body; im Frontend dafür nicht `response.json()` aufrufen.

## Nutzer-Synchronisation

Nach Clerk-Anmeldung `POST /api/me/sync` mit Token und ohne Body. Route lädt Clerk-Profil und führt `upsert` anhand eindeutiger `clerkId` aus. Bestehende lokale ID bleibt erhalten; neue Nutzer erhalten USER. Anzeigename: Username, alternativ Vorname, alternativ MemeFan. Beispielantwort:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "clerkId": "user_BEISPIEL",
  "username": "Beispielnutzer",
  "role": "USER"
}
```

Automatischer Frontend-Aufruf fehlt noch. Ohne lokales Profil liefern Upload, Kommentar-POST und Like-Aktionen 409. Ersteller und Rollen werden nicht aus Formularangaben übernommen.

## Upload und Titeländerung

POST /api/memes: `FormData` mit genau einer PNG-Datei im Feld `image` (höchstens 5 × 1024 × 1024 Bytes) und Textfeld `title` (getrimmt 1–100 Zeichen). Content-Type samt Boundary vom Browser/Postman setzen lassen. Kein Kategorie-Feld erforderlich. MIME-Vorprüfung und PNG-Signaturerkennung; keine vollständige Bilddekodierung. Lokales Profil wird vor Cloudinary-Upload gesucht. Bild wird im Cloudinary-Ordner `your-meme` gespeichert, Bildadresse/Public ID und lokale Ersteller-ID in PostgreSQL. Erfolg 201 mit Meme-Objekt.

Fehler: 401 Anmeldung; 400 Titel/Datei/Anzahl/Format; 413 Größe; 409 Profil fehlt; 500 Dienst-/DB-Fehler. Eine generische 400-Meldung enthält derzeit den Tippfehler `JPNG`; technisch gilt PNG. Bei DB-Fehler nach Upload wird versucht, das neue Bild zu löschen. Fehlgeschlagene Bereinigung wird protokolliert, nicht dauerhaft erneut eingeplant.

PATCH /api/memes/:id: JSON `{ "title": "Neuer Titel" }`, nur eigener Titel. Kein Bildaustausch implementiert; Entscheidung dazu offen.

DELETE /api/memes/:id: Besitzerprüfung, anschließend Cloudinary `destroy` mit resource_type image und invalidate true, dann Datenbanklöschung. `ok` und `not found` werden akzeptiert. Zugehörige Interaktionen werden durch die angewendeten FK-Kaskaden entfernt; Ordner selbst bleiben. Bei DB-Fehler nach erfolgreicher Bildlöschung bleibt vorübergehend ein Eintrag ohne Bild. Kein atomarer Ablauf über beide Dienste. Gemeinsam genutzte Cloudinary-Testoriginale nicht für Löschtests verwenden.

## Kommentare

POST und PATCH erwarten JSON `{ "content": "Mein Kommentar" }`. Getrimmt 1–1000 Zeichen. POST verknüpft Meme und lokalen angemeldeten Benutzer. PATCH/DELETE prüfen den Verfasser anhand der verifizierten Clerk-ID; fremde Kommentare 403. Erfolgreiches DELETE: 204. Anschließendes erneutes DELETE: 404. Administrator-Ausnahme noch nicht implementiert.

## Likes

POST und DELETE /api/memes/:id/like brauchen keinen Body. POST verwendet `createMany` mit `skipDuplicates`, DELETE `deleteMany` für eigene userId/memeId. Wiederholungen sind zulässig; sie erzeugen keine zusätzlichen eigenen Likes und entfernen keine fremden Likes. Jeweils 200, beispielsweise:

```json
{
  "memeId": "11111111-1111-4111-8111-111111111111",
  "liked": true,
  "likeCount": 1
}
```

Nach DELETE ist `liked` false; `likeCount` enthält weiterhin Likes anderer Nutzer. Mutation und anschließende Zählung sind getrennte DB-Abfragen. GET-Liste/-Detail geben noch keinen persönlichen Like-Status aus; Vertrag dafür als nächsten Integrationsschritt ergänzen. Das Frontend darf einen bereits gespeicherten Zähler nicht zusätzlich lokal erhöhen.

## Fehlerformat und verbleibender Umfang

Anwendungsrouten verwenden `{ "error": "Meldung" }`. Zentrale Parser-/Clerk-/Middlewarefehlerbehandlung fehlt: ungültiges JSON liefert aktuell 400 HTML mit internen Details, live bestätigt. Vor Abnahme korrigieren.

Noch keine Ordner-, Moderations- oder Kontolösch-Endpunkte. Pagination und Rate-Limits fehlen. `page=1&limit=20` ist weiterhin nur ein Planungsbeispiel, kein unterstützter Vertrag. Detail-Links lassen sich ohne zusätzlichen Backend-Teilen-Endpunkt verwenden. Kategorien, Suche und Editor gehören nicht zum vereinbarten Pflichtumfang; `altText` wäre eine gesondert abzustimmende Erweiterung.

[Prüfbelege und Restplan](projektstand.md) · [Backend starten](../README.md)

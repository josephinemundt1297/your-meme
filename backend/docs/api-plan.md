# Your Meme – API: Implementierung und Planung

## Ergänzung vom 13.11.2026: Administrator-Löschung

DELETE /api/memes/:id und DELETE /api/comments/:id erlauben jetzt den jeweiligen Besitzer **oder ADMIN**. Die Administratorrolle stammt ausschließlich aus PostgreSQL, gesucht über die verifizierte Clerk-ID. Ein fehlendes lokales Profil gewährt keine Adminrechte. Ohne Anmeldung weiterhin 401, normaler fremder Benutzer 403, fehlender Inhalt 404; Erfolg 204 ohne Body. Die vorhandene Cloudinary-/DB-Löschreihenfolge und ihre Teilausfallgrenzen bleiben bestehen.

PATCH auf fremde Memes/Kommentare bleibt auch für ADMIN verboten. Keine Administratorausnahme für private Ordner. Kein Rollenvergabe-Endpunkt; bestehende Konten wurden nicht hochgestuft. 21 isolierte Handler-Tests, Typprüfung und Build erfolgreich; Live-Integration mit echtem Administratorkonto noch offen. Diese Ergänzung ersetzt die unten auf den 12.11. bezogenen Aussagen zur fehlenden Administrator-Ausnahme; übrige Verträge bleiben unverändert.

Stand: 12.11.2026, einschließlich persönlichem Like-Status, Fehlerbehandlung und Ordner-Grundfunktionen; mit `src/server.ts` abgeglichen.

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
| DELETE /api/memes/:id | Ersteller oder ADMIN | Ohne Body; 204 leer; 400/401/403/404/500 |
| POST /api/memes/:id/comments | Angemeldet + lokales Profil | JSON content; 201 Kommentar; 400/401/404/409/500 |
| PATCH /api/comments/:id | Nur Verfasser | JSON content; 200 Kommentar; 400/401/403/404/500 |
| DELETE /api/comments/:id | Verfasser oder ADMIN | Ohne Body; 204 leer; 400/401/403/404/500 |
| POST /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |
| DELETE /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |
| POST /api/folders | Angemeldet + lokales Profil | JSON name; 201 Ordner; 400/401/409/500 |
| GET /api/folders | Angemeldet + lokales Profil | 200 nur eigene Ordner; 401/409/500 |
| GET /api/folders/:id | Nur Besitzer | 200 Ordner samt memes; 400/401/403/404/500 |
| POST /api/folders/:id/memes | Nur Besitzer | JSON memeId; 200 saved true, auch bei bestehender Zuordnung; 400/401/403/404/500 |
| DELETE /api/folders/:id/memes/:memeId | Nur Besitzer | Ohne Body; 200 saved false, auch wenn Zuordnung bereits fehlt; 400/401/403/404/500 |

Unbekannte Routen: 404 `{ "error": "Route nicht gefunden." }`. Geschützte Routen prüfen zuerst Anmeldung; deshalb kann ohne Token auch bei ungültiger ID zunächst 401 kommen. `:id` durch die tatsächliche jeweilige UUID ersetzen. Kommentare verwenden bei PATCH/DELETE die Kommentar-ID, nicht die Meme-ID. Ressourcenrennen zwischen Lesen und Schreiben können derzeit in generischem 500 enden.

## Antwortformate

Die folgenden IDs, Namen und Bildadresse sind Beispiele, keine echten Zugangsdaten oder garantierten Testressourcen.

Meme (Liste als Array, GET-Detail und Meme-POST/PATCH als einzelnes Objekt):

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

GET-Liste und GET-Detail ergänzen `likedByMe` als Boolean: bei erkanntem Benutzer dessen gespeicherter Like, sonst false. Dafür auch GET-Anfragen mit Bearer-Token senden. Meme-POST/PATCH und Ordner-Memes ergänzen dieses Feld derzeit nicht. Kein `category`, `altText`, `emoji` oder `imageStorageId` in öffentlichen Meme-Antworten. `userId` und `author.id` sind lokale UUIDs; `GET /api/me` liefert dagegen die Clerk-ID. Für eigene Schaltflächen die lokale ID aus `/api/me/sync` verwenden. Das Backend prüft Rechte unabhängig von der Oberfläche. Der Frontend-Client ersetzt `author` noch durch Community; das ist offen.

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

Automatischer Frontend-Aufruf ist implementiert; der Upload wartet seit dem aktuellen Frontend-Stand ausdrücklich auf erfolgreichen Sync und zeigt dessen Fehler. Layout unterdrückt Sync-Fehler weiterhin; Kommentar-/Like-Erstlogin ohne vorherigen Upload getrennt testen. Ohne lokales Profil liefern Upload, Kommentar-POST und Like-Aktionen 409. Ersteller und Rollen werden nicht aus Formularangaben übernommen.

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

Nach DELETE ist `liked` false; `likeCount` enthält weiterhin Likes anderer Nutzer. Mutation und anschließende Zählung sind getrennte DB-Abfragen. GET-Liste/-Detail liefern inzwischen likedByMe anhand des erkannten Benutzers. Frontend-GETs senden aktuell noch keinen Bearer-Token und laden bei Anmeldewechsel nicht neu; diese Anbindung fehlt. Das Frontend darf einen bereits gespeicherten Zähler nicht zusätzlich lokal erhöhen.

## Persönliche Ordner

Alle Ordner-Endpunkte erfordern Anmeldung. Lokale Nutzer-ID und Besitzer werden aus Clerk/DB bestimmt, nicht vom Body übernommen. Ein Ordner darf auch fremde öffentliche Memes enthalten; gespeichert wird nur eine FolderMeme-Zuordnung, kein zweites Bild.

- POST /api/folders erwartet `{ "name": "Meine Lieblingsmemes" }`, Name getrimmt 1–100 Zeichen. 201 mit id/name/createdAt. Gleichnamige Ordner sind derzeit zulässig.
- GET /api/folders liefert ein Array eigener Ordner (neueste zuerst), jeweils id/name/createdAt; ohne eigene Ordner `[]`.
- GET /api/folders/:id prüft Besitzer und liefert id/name/createdAt sowie `memes`, ein Array formatierter Meme-Objekte. Leer: `memes: []`. Diese eingebetteten Memes haben derzeit kein likedByMe.
- POST /api/folders/:id/memes erwartet `{ "memeId": "11111111-1111-4111-8111-111111111111" }`. Schema prüft UUID mit Zod; Ordner und Meme müssen existieren. Erfolg 200 mit `{ "folderId": "...", "memeId": "...", "saved": true }`. Wiederholung erzeugt dank zusammengesetztem Schlüssel und skipDuplicates keinen weiteren Eintrag.
- DELETE /api/folders/:id/memes/:memeId braucht keinen Body. Entfernt nur die passende Zuordnung, nicht das Meme oder Cloudinary-Bild. Erfolg 200 mit folderId/memeId/saved false; bei bereits fehlender Zuordnung ebenfalls 200. Ein separates Meme-Existenzprüfen findet hier nicht statt.

Fehler: ohne Anmeldung 401; bei Anlage/Liste fehlendes lokales Profil 409; ungültige Eingaben 400; Ordner fehlt 404; fremder Ordner 403; bei Hinzufügen fehlendes Meme 404. Gleichzeitige Löschungen zwischen Lesen und Schreiben können derzeit generische 500 auslösen.

Ordner umbenennen (PATCH) und ganzen Ordner löschen (DELETE /api/folders/:id) sind **noch nicht implementiert**. Ein HTTP-GET auf einen ausschließlich für POST/DELETE vorgesehenen Pfad liefert Route nicht gefunden; URL allein bestimmt nicht die Methode.

## Fehlerformat und verbleibender Umfang

Anwendungsfehler sind `{ "error": "Meldung" }`. Zentraler Handler nach Routen und 404 behandelt kaputtes JSON mit 400, zu große JSON-Bodies mit 413 und sonstige unbehandelte Fehler mit generischem 500. Parserfälle live als JSON ohne interne Details geprüft. Bereits begonnene Antworten werden über next(error) weitergereicht. Nicht alle denkbaren Clerk-/Middlewarefälle wurden einzeln geprüft; erwartete 4xx außerhalb der ausdrücklich behandelten Fälle können derzeit in 500 münden. Vorhandene fachliche Route-Fehler bleiben bestehen.

Moderations- und Kontolösch-Endpunkte fehlen; Pagination und Rate-Limits ebenfalls. `page=1&limit=20` bleibt Planungsbeispiel. Zwei-Konten-Ordner-/Kommentarrechte, befüllte Kaskaden und externe Teilausfälle abschließend testen. Detail-Links benötigen keinen eigenen Teilen-Endpunkt. Kategorien, Suche und Editor sind kein Pflichtumfang; altText/Bildaustausch separat abstimmen.

[Prüfbelege und Restplan](projektstand.md) · [Backend starten](../README.md)

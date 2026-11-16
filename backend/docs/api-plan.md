# Your Meme – API: Implementierung und Planung

## Zuverlässigkeit und Bildlöschung – 16.11.2026

Die vier freigegebenen Review-Befunde sind bearbeitet. Exakte Cloudinary-public_ids in Fixtures und lokaler DB korrigiert; Kategorien bleiben ausschließlich in PostgreSQL. Neue Uploads liefern `likedByMe: false` ohne nachträgliche Like-Abfrage. Meme-DELETE verwendet jetzt eine atomare Inhaltslöschung mit minimalem persistentem Bildauftrag; vollständiger Ablauf, Datenschutzgrenzen und Tests: [Bildlöschung](bildloeschung.md).

Meme-DELETE: 204 erst nach abgeschlossener Dateibereinigung und Auftragsentfernung; bei offenem Bildauftrag 503 mit verständlicher Meldung. Inhalt ist dann bereits nicht mehr sichtbar. Besitzer/ADMIN können denselben DELETE erneut senden; der Server wiederholt fällige Aufträge auch automatisch. Keine neue öffentliche Route. Echte Prisma-Konflikte P2025 → 404, P2003/P2002 → 409; keine Datenbankdetails in Antworten oder Logs. Vollständige Kontolöschung bleibt offen.

## Kategorien-Erweiterung vom 16.11.2026

Auf Josephines Auftrag ergänzt: eine feste Kategorie je Meme, ohne neue Route und ohne neue Tabelle. Die bestehende Frontend-Adresse `/?category=Alltag` bleibt erhalten. Die Website-Adresse auf Port 5173 ist von der API-Anfrage auf Port 3000 zu unterscheiden. Die Frontend-Anbindung bleibt Dileks Aufgabe.

- `GET /api/memes?category=Alltag&page=1&limit=50`: exakter Kategoriename, Filter in PostgreSQL vor Offset/Limit. Ohne `category` alle Memes, leere Treffer 200 mit `[]`. Unbekannte/leere/mehrfache Kategorien ergeben 400. Kein neuer Kategorien-Endpunkt.
- Erlaubte Werte (Groß-/Kleinschreibung beachten): `Ohne Kategorie`, `Programmieren`, `Alltag`, `Arbeit`, `Sport`, `Gaming`, `Tech`, `Animal`, `Movies`, `Outdoor`, `Study`, `Drinks`, `Food`, `Holiday`, `Book`, `Meeting`. Für Leerzeichen URL-Kodierung verwenden, z. B. `category=Ohne%20Kategorie`.
- `POST /api/memes`: zusätzliches Multipart-Textfeld `category`. Fehlt es, wird zur Kompatibilität mit dem bestehenden Upload `Ohne Kategorie` gespeichert; ein ausdrücklich ungültiger Wert wird vor Cloudinary-/DB-Zugriff mit 400 abgewiesen.
- `PATCH /api/memes/:id`: `title` und/oder `category`, mindestens eines. Beispiel: `{ "category": "Alltag" }`. Nur Ersteller, auch ADMIN darf fremde Memes weiterhin nicht bearbeiten. Ein reines Titel-Update lässt die Kategorie unverändert. Fehlendes/ungültiges Feld ergibt 400.
- Alle Meme-Antworten (Liste, Detail, POST/PATCH, Ordnerinhalte) enthalten `category` als String. `likedByMe`, Antwort-Arrays und Seiten-Header bleiben bestehen.
- Neue Migration `20261116093000_add_meme_category`: Pflichtfeld mit Standardwert `Ohne Kategorie` und SQL-CHECK für die erlaubten Werte. Lokal angewendet und geprüft. Alte Memes werden nicht anhand von Bild oder Titel automatisch eingeordnet.

Alle 15 bestehenden Menükategorien sind unterstützt: Programmieren, Alltag, Arbeit, Sport, Gaming, Tech, Animal, Movies, Outdoor, Study, Drinks, Food, Holiday, Book und Meeting. Für jeden dieser Werte sowie `Ohne Kategorie` sind öffentlicher Filter, Seitenwechsel und nachträgliche Besitzer-Zuordnung einzeln über HTTP getestet; Upload-Tests decken ebenfalls alle Werte ab.

Zusätzliche Absicherung nach Code-Review: Die vollständige vereinbarte Kategorienliste wird unabhängig vom Anwendungscode als Testvertrag geprüft, einschließlich Abgleich mit dem SQL-CHECK. Ein HTTP-Regressionstest prüft nach PATCH das Verschwinden aus dem alten und das Erscheinen im neuen Kategorie-Filter; andere Memes bleiben unverändert. Gesamte Backend-Suite: 98 erfolgreiche Tests mit simulierten Diensten. Diese Tests ersetzen keine authentifizierte Browser-Abnahme.

Dilek: vorhandenen URL-Parameter lesen und als gleichnamigen API-Parameter senden, bei Auswahlwechsel Seite 1 laden und bei „Alle“ den Parameter weglassen. Upload um Kategorie-Auswahl ergänzen. Diese UI-Schritte sind hier nicht umgesetzt. Grenzwerte und Authentifizierung gelten weiter.

## Vorheriger Abgleich vom 13.11.2026

Mit den Routern und Controllern unter `src/modules/` abgeglichen: 22 Methoden-/Pfad-Kombinationen. Aufteilung und letzte Testnachweise: [Architektur](architektur.md), [Projektstand](projektstand.md). Die 72 HTTP-Tests verwenden simulierte externe Dienste; die früheren 21 Moderationstests sind darin enthalten. Eine neue Live-Abnahme angemeldeter Schreibaktionen ist noch offen.

Vollständige Kontolöschung ist die nächste große offene Pflichtfunktion. Eine konkrete Route und ihr Fehler-/Wiederholungsvertrag werden vor Umsetzung vorgeschlagen; es gibt aktuell keinen implementierten Kontolösch-Endpunkt. Die folgende Übersicht beschreibt bestehende Endpunkte.

## Administrator-Löschung

DELETE /api/memes/:id und DELETE /api/comments/:id erlauben jetzt den jeweiligen Besitzer **oder ADMIN**. Die Administratorrolle stammt ausschließlich aus PostgreSQL, gesucht über die verifizierte Clerk-ID. Ein fehlendes lokales Profil gewährt keine Adminrechte. Ohne Anmeldung weiterhin 401, normaler fremder Benutzer 403, fehlender Inhalt 404; Erfolg 204 ohne Body. Für Meme-Bilder gilt der neue Transaktions-/Bereinigungsablauf; Kommentare werden direkt in PostgreSQL gelöscht.

PATCH auf fremde Memes/Kommentare bleibt auch für ADMIN verboten. Keine Administratorausnahme für private Ordner. Kein öffentlicher Rollenvergabe-Endpunkt. Die ADMIN-Ausnahme ist in den HTTP-Regressionstests enthalten; diese simulieren Rollen und Dienstanbindungen. Fremde Inhalte bearbeiten und fremde private Ordner verwalten bleibt verboten.

Stand: 16.11.2026, einschließlich Kategorien, persönlichem Like-Status, Fehlerbehandlung, vollständiger Ordner-Endpunkte und ADMIN-Löschrechten; anhand der modularen Implementierung abgeglichen.

Basis: `http://localhost:3000`. CORS: `http://localhost:5173`. Geschützte Anfragen: `Authorization: Bearer <SESSION_TOKEN>`. Kein Clerk Secret Key als Nutzer-Token. Browser-Anmeldung wird nicht automatisch an Postman übertragen.

## Implementierte Endpunkte

| Methode und Pfad | Zugriff | Erfolg und wichtige Fehler |
| --- | --- | --- |
| GET /api/health | Öffentlich | 200 `{ "status": "ok" }` |
| GET /api/health/db | Öffentlich | 200 connected; bei DB-Ausfall 503 disconnected |
| GET /api/memes | Öffentlich | 200 Array, page/limit und optional category; neueste zuerst; ungültige Query 400 |
| GET /api/memes/:id | Öffentlich | 200 Meme; ungültige ID 400, fehlendes Meme 404 |
| GET /api/memes/:id/comments | Öffentlich | 200 Array, älteste zuerst; ID 400, Meme fehlt 404 |
| GET /api/me | Angemeldet | 200 `{ "clerkId": "user_BEISPIEL" }`; 401 |
| POST /api/me/sync | Angemeldet | Ohne Body; 200 lokales Profil; 401/500 |
| POST /api/memes | Angemeldet + lokales Profil | Multipart; 201 Meme; 400/401/409/413/500 |
| PATCH /api/memes/:id | Nur Ersteller | JSON title und/oder category; 200 Meme; 400/401/403/404/500 |
| DELETE /api/memes/:id | Ersteller oder ADMIN | Ohne Body; 204 abgeschlossen; 503 Bildauftrag offen; 400/401/403/404/409/500 |
| POST /api/memes/:id/comments | Angemeldet + lokales Profil | JSON content; 201 Kommentar; 400/401/404/409/500 |
| PATCH /api/comments/:id | Nur Verfasser | JSON content; 200 Kommentar; 400/401/403/404/500 |
| DELETE /api/comments/:id | Verfasser oder ADMIN | Ohne Body; 204 leer; 400/401/403/404/500 |
| POST /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |
| DELETE /api/memes/:id/like | Angemeldet + lokales Profil | Ohne Body; 200 Like-Zustand; 400/401/404/409/500 |
| POST /api/folders | Angemeldet + lokales Profil | JSON name; 201 Ordner; 400/401/409/500 |
| GET /api/folders | Angemeldet + lokales Profil | 200 nur eigene Ordner; 401/409/500 |
| GET /api/folders/:id | Nur Besitzer | 200 Ordner samt memes; 400/401/403/404/500 |
| PATCH /api/folders/:id | Nur Besitzer | JSON name, getrimmt 1–100 Zeichen; 200 Ordner; 400/401/403/404/500 |
| DELETE /api/folders/:id | Nur Besitzer | Ohne Body; 204 leer; 400/401/403/404/500; ursprüngliche Memes bleiben erhalten |
| POST /api/folders/:id/memes | Nur Besitzer | JSON memeId; 200 saved true, auch bei bestehender Zuordnung; 400/401/403/404/500 |
| DELETE /api/folders/:id/memes/:memeId | Nur Besitzer | Ohne Body; 200 saved false, auch wenn Zuordnung bereits fehlt; 400/401/403/404/500 |

Unbekannte Routen: 404 `{ "error": "Route nicht gefunden." }`. Geschützte Routen prüfen zuerst Anmeldung; deshalb kann ohne Token auch bei ungültiger ID zunächst 401 kommen. `:id` durch die tatsächliche jeweilige UUID ersetzen. Kommentare verwenden bei PATCH/DELETE die Kommentar-ID, nicht die Meme-ID. Erwartete Prisma-Fehler bei gleichzeitigen Änderungen ergeben 404 (P2025) oder 409 (P2003/P2002).

## Antwortformate

Die folgenden IDs, Namen und Bildadresse sind Beispiele, keine echten Zugangsdaten oder garantierten Testressourcen.

Meme (Liste als Array, GET-Detail und Meme-POST/PATCH als einzelnes Objekt):

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "title": "Beispiel-Meme",
  "category": "Alltag",
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

Alle Meme-Antworten einschließlich Liste, Detail, POST/PATCH und Ordner-Memes enthalten `likedByMe` als Boolean: bei erkanntem Benutzer dessen gespeicherter Like, sonst false. Dafür auch GET-Anfragen mit Bearer-Token senden. Ordner-Memes beziehen den Like-Status auf den angemeldeten Ordnerbesitzer; die Likes werden gemeinsam geladen. Kein `altText`, `emoji` oder `imageStorageId` in öffentlichen Meme-Antworten. `userId` und `author.id` sind lokale UUIDs; `GET /api/me` liefert dagegen die Clerk-ID. Für eigene Schaltflächen die lokale ID aus `/api/me/sync` verwenden. Das Backend prüft Rechte unabhängig von der Oberfläche. Der aktuelle Frontend-Client übernimmt `author`; Community dient nur als Ersatz bei fehlendem Autor.

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

POST /api/memes: `FormData` mit genau einer PNG-Datei im Feld `image` (höchstens 5 × 1024 × 1024 Bytes) und Textfeld `title` (getrimmt 1–100 Zeichen). Content-Type samt Boundary vom Browser/Postman setzen lassen. Optionales Textfeld `category` aus der oben genannten festen Liste; fehlt es, Standard `Ohne Kategorie`. MIME-Vorprüfung und PNG-Signaturerkennung; keine vollständige Bilddekodierung. Lokales Profil wird vor Cloudinary-Upload gesucht. Bild wird im Cloudinary-Ordner `your-meme` gespeichert, Bildadresse/Public ID und lokale Ersteller-ID in PostgreSQL. Erfolg 201 mit Meme-Objekt.

Fehler: 401 Anmeldung; 400 Titel/Datei/Anzahl/Format; 413 Größe; 409 Profil fehlt; 500 Dienst-/DB-Fehler. Die Datei-Fehlermeldung nennt jetzt korrekt PNG. Bei DB-Fehler nach Upload wird versucht, das neue Bild zu löschen. Fehlgeschlagene Bereinigung wird protokolliert, nicht dauerhaft erneut eingeplant.

PATCH /api/memes/:id: JSON mit `title` und/oder `category`, mindestens eines; nur eigene Memes. Titel-only bleibt gültig, Kategorie-only ermöglicht nachträgliches Zuordnen. Kein Bildaustausch implementiert; Entscheidung dazu offen.

DELETE /api/memes/:id: Besitzer-/ADMIN-Prüfung, dann PostgreSQL-Transaktion mit minimalem Bildauftrag und Meme-Löschung einschließlich Interaktionskaskaden. Erst danach Cloudinary destroy mit resource_type image und invalidate true. Bei ok/not found Auftrag entfernen und 204; bei offenem Auftrag 503, erneutes DELETE erlaubt. Hintergrunddienst wiederholt fällige Aufträge. Ordner selbst bleiben. CDN-/Backup-Grenzen und Rechte bei Wiederholung stehen in [bildloeschung.md](bildloeschung.md). Gemeinsam genutzte Cloudinary-Testoriginale nicht für Löschtests verwenden.

## Kommentare

POST und PATCH erwarten JSON `{ "content": "Mein Kommentar" }`. Getrimmt 1–1000 Zeichen. POST verknüpft Meme und lokalen angemeldeten Benutzer. PATCH/DELETE prüfen den Verfasser anhand der verifizierten Clerk-ID; fremde Kommentare 403. Erfolgreiches DELETE: 204. Anschließendes erneutes DELETE: 404. Bei DELETE darf zusätzlich ADMIN löschen; PATCH bleibt dem Verfasser vorbehalten.

## Likes

POST und DELETE /api/memes/:id/like brauchen keinen Body. POST verwendet `createMany` mit `skipDuplicates`, DELETE `deleteMany` für eigene userId/memeId. Wiederholungen sind zulässig; sie erzeugen keine zusätzlichen eigenen Likes und entfernen keine fremden Likes. Jeweils 200, beispielsweise:

```json
{
  "memeId": "11111111-1111-4111-8111-111111111111",
  "liked": true,
  "likeCount": 1
}
```

Nach DELETE ist `liked` false; `likeCount` enthält weiterhin Likes anderer Nutzer. Mutation und anschließende Zählung sind getrennte DB-Abfragen. GET-Liste/-Detail liefern inzwischen likedByMe anhand des erkannten Benutzers. Der Client muss bei angemeldeten GETs einen Bearer-Token senden und bei Anmeldewechsel neu laden. Im aktuell gelesenen Frontend-Code senden Übersicht und Detail einen Token und laden bei Anmelde-/Benutzerwechsel neu. Dieser Codebefund ersetzt keinen Browser-Abnahmetest. Das Frontend darf einen bereits gespeicherten Zähler nicht zusätzlich lokal erhöhen.

## Persönliche Ordner

Alle Ordner-Endpunkte erfordern Anmeldung. Lokale Nutzer-ID und Besitzer werden aus Clerk/DB bestimmt, nicht vom Body übernommen. Ein Ordner darf auch fremde öffentliche Memes enthalten; gespeichert wird nur eine FolderMeme-Zuordnung, kein zweites Bild.

- POST /api/folders erwartet `{ "name": "Meine Lieblingsmemes" }`, Name getrimmt 1–100 Zeichen. 201 mit id/name/createdAt. Gleichnamige Ordner sind derzeit zulässig.
- GET /api/folders liefert ein Array eigener Ordner (neueste zuerst), jeweils id/name/createdAt; ohne eigene Ordner `[]`.
- PATCH /api/folders/:id erwartet JSON name, getrimmt 1–100 Zeichen. Nur Besitzer; 200 mit id/name/createdAt.
- DELETE /api/folders/:id benötigt keinen Body. Nur Besitzer; 204 ohne Antwortinhalt. Zuordnungen werden per DB-Kaskade entfernt; ursprüngliche Memes und Bilder bleiben bestehen.
- GET /api/folders/:id prüft Besitzer und liefert id/name/createdAt sowie `memes`, ein Array formatierter Meme-Objekte. Leer: `memes: []`. Diese eingebetteten Memes enthalten likedByMe für den angemeldeten Besitzer.
- POST /api/folders/:id/memes erwartet `{ "memeId": "11111111-1111-4111-8111-111111111111" }`. Schema prüft UUID mit Zod; Ordner und Meme müssen existieren. Erfolg 200 mit `{ "folderId": "...", "memeId": "...", "saved": true }`. Wiederholung erzeugt dank zusammengesetztem Schlüssel und skipDuplicates keinen weiteren Eintrag.
- DELETE /api/folders/:id/memes/:memeId braucht keinen Body. Entfernt nur die passende Zuordnung, nicht das Meme oder Cloudinary-Bild. Erfolg 200 mit folderId/memeId/saved false; bei bereits fehlender Zuordnung ebenfalls 200. Ein separates Meme-Existenzprüfen findet hier nicht statt.

Fehler: ohne Anmeldung 401; bei Anlage/Liste fehlendes lokales Profil 409; ungültige Eingaben 400; Ordner fehlt 404; fremder Ordner 403; bei Hinzufügen fehlendes Meme 404. Erwartete Prisma-Konflikte bei gleichzeitigen Löschungen ergeben 404 oder 409.

Ordner umbenennen (PATCH /api/folders/:id) und ganzen Ordner löschen (DELETE /api/folders/:id) sind implementiert. Auch ADMIN erhält keinen Zugriff auf fremde private Ordner. Ein HTTP-GET auf einen ausschließlich für POST/DELETE vorgesehenen Pfad liefert Route nicht gefunden; URL allein bestimmt nicht die Methode.

## Pagination der Meme-Liste

`GET /api/memes?page=1&limit=50`: unverändertes Array-Format, standardmäßig page 1 und limit 50. Erlaubt: page 1–10000, limit 1–100, jeweils einzelne positive ganze Zahlen. Zusätzlich ist `category` aus der festen Liste erlaubt. Unbekannte Query-Felder, leere Werte, Mehrfachwerte oder Überschreitungen ergeben 400. Eine Seite ohne Treffer liefert 200 und `[]`.

Antwort-Header: `X-Page`, `X-Limit`, `X-Has-More` (true/false), über CORS freigegeben. Die DB-Abfrage lädt höchstens limit + 1 Einträge, um eine Folgeseite zu erkennen; im Body stehen höchstens limit Einträge. Sortierung createdAt desc, id desc. Es gibt keine Gesamtzahl. Bei gleichzeitigen Einfügungen kann Offset-Pagination Einträge zwischen Seiten verschieben. Frontend-Seitennavigation fehlt noch; Kommentar-/Ordnerlisten sind weiterhin nicht paginiert.

## Anfragebegrenzung

Innerhalb von 60 Sekunden je IP und Serverprozess: 300 API-Anfragen insgesamt, höchstens 60 Schreibanfragen und höchstens 10 POST-Anfragen auf /api/memes. Schreiben umfasst Methoden außer GET/HEAD/OPTIONS. Auch fehlgeschlagene Versuche zählen. OPTIONS ist ausgenommen. Alle Limits gelten zusätzlich zu den bisherigen Datei- und Body-Größenlimits.

Bei Überschreitung: 429 `{ "error": "Zu viele Anfragen. Bitte später erneut versuchen." }` und `Retry-After` in Sekunden. Da diese Prüfung vor Body-Parser und Clerk erfolgt, kann auch eine nicht angemeldete Anfrage zuerst 429 erhalten. Bestehende Authentifizierungsfehler bleiben innerhalb der Limits 401. Maximal 10000 Client-Einträge pro Limiter; neue Clients erhalten bei voller Tabelle 503 mit Retry-After.

Prozesslokaler Speicher, kein gemeinsamer Zähler über mehrere Prozesse; Neustart setzt Zähler zurück. Gemeinsame IPs teilen das Budget. Kein Vertrauen in beliebige X-Forwarded-For-Header; Proxy-Konfiguration gesondert festlegen. `Retry-After` wird über CORS freigegeben.

## Fehlerformat und verbleibender Umfang

Anwendungsfehler sind `{ "error": "Meldung" }`. Zentraler Handler nach Routen und 404 behandelt kaputtes JSON mit 400, zu große JSON-Bodies mit 413 und sonstige unbehandelte Fehler mit generischem 500. Parserfälle live als JSON ohne interne Details geprüft. Bereits begonnene Antworten werden über next(error) weitergereicht. Nicht alle denkbaren Clerk-/Middlewarefälle wurden einzeln geprüft; erwartete 4xx außerhalb der ausdrücklich behandelten Fälle können derzeit in 500 münden. Vorhandene fachliche Route-Fehler bleiben bestehen.

ADMIN-Löschrechte sind in den bestehenden Meme-/Kommentar-DELETE-Routen enthalten. Kontolöschung bleibt offen. Pagination der Meme-Liste und lokale Rate-Limits sind implementiert; ihre Grenzen stehen unten. Zwei-Konten-Ordner-/Kommentarrechte, befüllte Kaskaden und externe Teilausfälle abschließend testen. Detail-Links benötigen keinen eigenen Teilen-Endpunkt. Kategorien wurden am 16.11. ausdrücklich als Erweiterung beauftragt; Suche und Editor bleiben außerhalb des Pflichtumfangs; altText/Bildaustausch separat abstimmen.

[Prüfbelege und Restplan](projektstand.md) · [Backend starten](../README.md)

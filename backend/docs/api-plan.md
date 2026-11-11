# Your Meme – API: Implementierung und Planung

Stand: 11.11.2026, mit `src/server.ts`, Auswahl und Formatierung abgeglichen. Implementierte Antworten und noch geplante Funktionen werden getrennt beschrieben.

Basis: `http://localhost:3000`. CORS erlaubt `http://localhost:5173`. Öffentliche Abfragen benötigen keinen Login. Geschützte Anfragen verwenden einen gültigen Clerk-Session-Token als `Authorization: Bearer <SESSION_TOKEN>`.

## Implementierte Endpunkte

| Methode und Pfad | Zugriff | Ergebnis |
| --- | --- | --- |
| `GET /api/health` | Öffentlich | 200, `{ "status": "ok" }` |
| `GET /api/health/db` | Öffentlich | 200, `{ "status": "ok", "database": "connected" }`; bei DB-Fehler 503 mit `status: "error"`, `database: "disconnected"` |
| `GET /api/memes` | Öffentlich | 200, Array, neueste zuerst; noch ohne Pagination oder Mengenlimit |
| `GET /api/memes/:id` | Öffentlich | 200, Meme-Objekt; ungültige UUID 400, nicht vorhanden 404 |
| `GET /api/memes/:id/comments` | Öffentlich | 200, Array, älteste zuerst; ungültige UUID 400, Meme nicht vorhanden 404 |
| `GET /api/me` | Angemeldet | 200, `{ "clerkId": "user_BEISPIEL" }`; ohne Anmeldung 401 |
| `POST /api/me/sync` | Angemeldet | Ohne Body; 200, lokales Profil anlegen/aktualisieren; ohne Anmeldung 401, Dienst-/DB-Fehler 500 |
| `POST /api/memes` | Angemeldet | Multipart-Upload-Prüfung; 200 ohne Speicherung, Details unten |

### Meme-Antwort

Beispiel mit erfundenen IDs; Liste liefert ein Array solcher Objekte, Detail liefert ein einzelnes Objekt:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "title": "Beispiel-Meme",
  "imageUrl": "https://BILDADRESSE.example/meme.png",
  "userId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-11-10T09:00:00.000Z",
  "author": {
    "id": "22222222-2222-4222-8222-222222222222",
    "username": "Beispielnutzer"
  },
  "likeCount": 0,
  "commentCount": 0
}
```

Die Bildadresse ist ein Platzhalter, keine funktionierende Testdatei. Die API liefert aktuell weder `category`, `emoji`, `likedByMe`, `altText` noch `imageStorageId`. Der Frontend-Client setzt bisher Ersatzwerte und ersetzt sogar den gelieferten Erstellernamen durch `Community`; die Übernahme von `author` ist noch offen.

### Kommentar-Antwort

Beispiel eines Elements im Array:

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "content": "Beispielkommentar",
  "userId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-11-10T09:05:00.000Z",
  "user": { "username": "Beispielnutzer" }
}
```

Ohne Kommentare lautet die Antwort `[]`. Kommentare werden erst nach Prüfung der Meme-Existenz abgefragt.

### Nutzer-Synchronisation

`POST /api/me/sync` ermittelt die Clerk-ID ausschließlich aus der geprüften Anmeldung. Clerk liefert den Anzeigenamen; Prisma sucht über die eindeutige `clerkId`. Ein vorhandener Nutzer wird aktualisiert, andernfalls neu angelegt. Beispielantwort:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "clerkId": "user_BEISPIEL",
  "username": "Beispielnutzer",
  "role": "USER"
}
```

Wiederholte Aufrufe verwenden dieselbe lokale ID. Der Aufruf aus der Anmeldeoberfläche ist noch nicht automatisch angebunden. `GET /api/me` liefert bisher nur die Clerk-ID, nicht dieses lokale Profil.

### Fehler

Anwendungsrouten liefern Fehler als `{ "error": "Verständliche Meldung" }`, z. B. 401 mit `Bitte zuerst anmelden.`. Unbekannte Routen liefern 404 mit `Route nicht gefunden.`. Datenbankabfragen fangen Fehler ab und liefern 500 mit einer fachlichen Meldung. Eine zentrale Fehlerbehandlung für JSON-Parser-, Clerk- und sonstige Middlewarefehler fehlt noch; das JSON-Format ist deshalb noch nicht für alle Fehler garantiert.

## POST /api/memes – implementierte Upload-Prüfung

Anmeldung wird vor der Dateiannahme geprüft. Request: `multipart/form-data`, vom Client samt Boundary setzen lassen.

| Feld | Typ | Regel |
| --- | --- | --- |
| `title` | Text | Getrimmt, 1–100 Zeichen |
| `image` | Datei | Genau ein PNG; höchstens 5 × 1024 × 1024 Bytes (5 MiB) |

Multer hält die Datei im Arbeitsspeicher und prüft die MIME-Angabe. Anschließend erkennt `isPng` die PNG-Signatur mittels file-type. Das ist keine vollständige Dekodierung oder Garantie einer unbeschädigten Bilddatei. `imageUrl`, `imageStorageId` und Ersteller-ID werden nicht vom Formular verlangt.

Aktuelle Erfolgsantwort: HTTP 200, ausdrücklich noch keine Anlage und kein 201:

```json
{
  "message": "Upload-Prüfung erfolgreich. Noch nichts gespeichert.",
  "title": "Mein Upload-Test"
}
```

- Ohne gültige Anmeldung: 401.
- Ungültiger Titel, fehlende/falsche Datei, mehrere Dateien oder falsches Dateifeld: 400.
- Datei über dem Größenlimit: 413.
- Eine generische 400-Meldung lautet noch `Bitte genau ein JPG/JPEG-Bild im Feld image senden.` Das ist ein bekannter Textfehler; MIME- und Signaturprüfung erlauben PNG.

Josephine bestätigt den erfolgreichen PNG-Test mit obiger Antwort. Mehrfachauswahl und PNG-Formatumstellung wurden im Gespräch geprüft. Vollständige Tests aller Titel-, Größen- und Fehlerfälle stehen noch aus.

`src/lib/uploadImage.ts` ist separat implementiert: PNG-Upload-Stream, Cloudinary-Ordner `your-meme`, Ergebnis `imageUrl`/`imageStorageId`. Die Route importiert oder verwendet diese Funktion noch nicht. Lokalen Ersteller zuordnen, Bild übertragen, Meme speichern und bei DB-Fehler das neue Bild bereinigen bleiben nächste Schritte. Noch kein vollständiger Upload-Vertrag für eine gespeicherte Erfolgsantwort.

## Verbleibender Lösch-Platzhalter

- `DELETE /api/memes/:id`: UUID-Prüfung, danach 503, `Meme-Löschung ist noch nicht verfügbar.` Keine Löschung und noch keine Eigentümer-/Adminprüfung.

## Geplanter Umfang

- PNG-Upload-Prüfung mit Cloudinary-Hilfsfunktion und lokaler Ersteller-/Meme-Speicherung verbinden; Fehlerbereinigung und abschließende Erfolgsantwort ergänzen. Regeln und Feldnamen für neue Uploads sind jetzt festgelegt; das vorhandene Frontend-Formular muss noch darauf ausgerichtet werden.
- `PATCH /api/memes/:id`: Bearbeiten durch Ersteller; noch nicht implementiert.
- Meme-Löschung durch Ersteller oder Administrator einschließlich Cloudinary-Datei.
- Endpunkte für Likes, Kommentaränderungen, persönliche Ordner, Moderation und Kontolöschung konkretisieren und implementieren.
- Pagination mit Standardwert und maximaler Seitengröße festlegen; `page=1&limit=20` bleibt nur ein Planungsbeispiel.
- Eingaben, Rechte, Erfolgs- und Fehlerfälle pro Funktion dokumentieren und testen.
- Teilen zunächst über Detail-Links; kein eigener Backend-Endpunkt nötig. Frontend-Detailseite verwendet noch Beispieldaten.

Der vorgeschlagene Alternativtext `altText` wurde noch nicht als Schemafeld umgesetzt. Keine Erweiterung des Datenmodells allein durch diese Dokumentation.

[Geprüfter Projektstand](projektstand.md) · [Backend-Start](../README.md)

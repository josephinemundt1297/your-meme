# Your Meme – Datenmodell

Stand: 11.11.2026. Sechs Modelle und Initialmigration unverändert. Aktuelle DB-Abfrage bestätigt die abgeschlossene, nicht zurückgerollte Initialmigration `20261104125318_init`. Meme-, Kommentar- und Like-Schreibaktionen nutzen jetzt diese Modelle. Eine leere oder vorhandene Tabelle allein belegt keine fertige Nutzerfunktion.

Clerk-Identität, lokale Nutzer-Synchronisation und Besitzerprüfungen für Meme-/Kommentaränderungen sind implementiert. Ordnerzugriffe, Administrator-Moderation und dienstübergreifende Kontolöschung bleiben Zielanforderungen.

## Technische Grundlage

- Node.js, Express und TypeScript
- PostgreSQL mit Prisma
- Clerk für Registrierung, Anmeldung und Passwortverwaltung
- Bildspeicher: Cloudinary; automatischer PNG-Upload und Meme-Dateilöschung implementiert, gemeinsame Fixture-Originale zusätzlich vorhanden
- Hosting: optional; Anbieter noch offen

## Beziehungsdiagramm

`PK` bezeichnet einen Primärschlüssel, `FK` einen Fremdschlüssel und `UK` einen eindeutigen Wert.
`||--o{` bedeutet: Ein Datensatz links kann mit null bis vielen Datensätzen rechts verbunden sein;
jeder Datensatz rechts gehört genau einem Datensatz links.

```mermaid
erDiagram
    User ||--o{ Meme : erstellt
    User ||--o{ Comment : schreibt
    User ||--o{ Like : vergibt
    User ||--o{ Folder : besitzt
    Meme ||--o{ Comment : hat
    Meme ||--o{ Like : erhaelt
    Meme ||--o{ FolderMeme : wird_gespeichert
    Folder ||--o{ FolderMeme : enthaelt

    User {
        uuid id PK
        string clerkId UK
        string username
        Role role "USER oder ADMIN"
        datetime createdAt
    }
    Meme {
        uuid id PK
        string title
        string imageUrl
        string imageStorageId
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }
    Comment {
        uuid id PK
        string content
        uuid userId FK
        uuid memeId FK
        datetime createdAt
        datetime updatedAt
    }
    Like {
        uuid userId PK,FK
        uuid memeId PK,FK
        datetime createdAt
    }
    Folder {
        uuid id PK
        string name
        uuid userId FK
        datetime createdAt
    }
    FolderMeme {
        uuid folderId PK,FK
        uuid memeId PK,FK
        datetime createdAt
    }
```

## Bedeutung der Modelle

- **User:** lokales Nutzerprofil mit Verknüpfung zum Clerk-Konto und Anwendungsrolle.
- **Meme:** Titel, Bildadresse (`imageUrl`), Cloudinary-Public-ID (`imageStorageId`) und Ersteller. Public ID und vollständige URL sind unterschiedliche Werte; bei Ordnerpfaden gehört der Pfad zur Public ID.
- **Comment:** Kommentartext mit Verweis auf Verfasser und Meme.
- **Like:** Zuordnung eines Nutzers zu einem gelikten Meme.
- **Folder:** persönlicher Ordner eines Nutzers.
- **FolderMeme:** Zuordnung eines Memes zu einem Ordner; die Bilddatei wird nicht kopiert.

## Eindeutigkeit und Standardwerte

- `User.clerkId` ist eindeutig; Passwörter werden ausschließlich von Clerk verwaltet.
- `User.username` ist ein öffentlicher Anzeigename und in diesem Entwurf nicht eindeutig.
- Die Standardrolle neuer Nutzer ist `USER`; `ADMIN` wird ausschließlich über einen vertrauenswürdigen serverseitigen Prozess vergeben.
- Eigenständige IDs von User, Meme, Comment und Folder werden beim Anlegen über Prisma als UUIDs erzeugt (`@default(uuid())`). Die SQL-Migration enthält dafür keinen Datenbank-Standardwert; bei direkten SQL-Inserts müssen IDs mitgegeben werden.
- Like hat einen zusammengesetzten Primärschlüssel aus `userId` und `memeId`.
- FolderMeme hat einen zusammengesetzten Primärschlüssel aus `folderId` und `memeId`.
- Dadurch kann ein Nutzer ein Meme höchstens einmal liken und ein Meme höchstens einmal pro Ordner speichern.
- Ein Meme kann gleichzeitig in mehreren Ordnern gespeichert sein.
- `createdAt` wird automatisch gesetzt. Bei Meme und Comment verwaltet Prisma zusätzlich `updatedAt`; für direkte SQL-Updates gibt es in der Migration keinen entsprechenden Trigger.

## Berechtigungen

Zielregeln für die gesamte Anwendung. Bereits vorhanden: öffentliche Abfragen, eigene Meme-/Kommentarverwaltung und Likes. Noch offen: Ordner, Admin-Ausnahmen und Kontolöschung. Die Tabelle beschreibt daher nicht überall bereits verfügbares Verhalten:

| Aktion                                       | Besucher | Angemeldete Nutzer | Administratoren |
| -------------------------------------------- | -------- | ------------------ | --------------- |
| Memes ansehen und Links teilen               | Ja       | Ja                 | Ja              |
| Memes hochladen                              | Nein     | Ja                 | Ja              |
| Eigene Memes bearbeiten und löschen          | Nein     | Ja                 | Ja              |
| Fremde Memes löschen                         | Nein     | Nein               | Ja              |
| Memes liken und eigene Likes entfernen       | Nein     | Ja                 | Ja              |
| Kommentare schreiben                         | Nein     | Ja                 | Ja              |
| Eigene Kommentare bearbeiten und löschen     | Nein     | Ja                 | Ja              |
| Fremde Kommentare löschen                    | Nein     | Nein               | Ja              |
| Eigene Ordner erstellen und verwalten        | Nein     | Ja                 | Ja              |
| Auf fremde persönliche Ordner zugreifen      | Nein     | Nein               | Nein            |
| Eigenes Nutzerkonto nach Bestätigung löschen | Nein     | Ja                 | Ja              |

- Das Backend prüft bei geschützten Anfragen die Clerk-Identität.
- Die lokale Nutzerzuordnung erfolgt anhand der verifizierten Clerk-ID.
- Eigentümerrechte werden bei Meme-/Kommentaränderungen serverseitig geprüft. Administrator-Ausnahmen sind noch nicht umgesetzt.
- Fremde Memes und Kommentare dürfen von Administratoren gelöscht, aber nicht bearbeitet werden.
- Das Backend übernimmt die Identität und Rolle nicht ungeprüft aus dem Request-Body.

## Löschregeln

Die relationalen Löschkaskaden sind in Schema und Migration definiert (`onDelete: Cascade`).
Für ihre Wirkung muss die Migration in der Datenbank angewendet sein.
Meme-Bildlöschung ist implementiert: erst Cloudinary, dann PostgreSQL. Ein separater Upload-Test wurde erfolgreich gelöscht und die Entfernung in beiden Diensten geprüft. Ein befüllter Kaskadentest mit Kommentaren, Likes und Ordnereinträgen fehlt noch. Bei DB-Fehler nach Bildlöschung kann vorübergehend ein Eintrag ohne Bild bestehen; erneuter Versuch akzeptiert ein bereits fehlendes Bild. Vollständige Kontolöschung, Bestätigung und dauerhafte Wiederholungslogik sind noch nicht implementiert.

- Meme löschen: zugehörige Kommentare, Likes und FolderMeme-Einträge entfernen.
- Die Bilddatei zusätzlich beim Bildspeicherdienst löschen; Datenbankregeln allein entfernen keine externen Dateien.
- Ordner löschen: zugehörige FolderMeme-Einträge entfernen; die ursprünglichen Memes bleiben erhalten.
- Meme aus einem Ordner entfernen: ausschließlich die betreffende FolderMeme-Zuordnung löschen.
- Kommentar oder Like löschen: ausschließlich den jeweiligen Eintrag entfernen.
- Nutzerkonto löschen: nach ausdrücklicher Bestätigung das eigene Konto und die unten aufgeführten Daten dauerhaft löschen.

### Nutzerkonto dauerhaft löschen

- Alle vom Nutzer hochgeladenen Memes einschließlich ihrer Bilddateien beim Bildspeicherdienst löschen.
- Alle zu diesen Memes gehörenden Kommentare, Likes und Ordnerzuordnungen entfernen, auch wenn sie von anderen Nutzern stammen.
- Die gelöschten Memes verschwinden dadurch auch aus den Sammlungen anderer Nutzer; deren Ordner bleiben bestehen.
- Alle Kommentare des Nutzers entfernen, auch unter Memes anderer Nutzer.
- Alle Likes des Nutzers entfernen, auch auf Memes anderer Nutzer.
- Alle persönlichen Ordner des Nutzers einschließlich ihrer FolderMeme-Zuordnungen löschen.
- Memes anderer Nutzer bleiben erhalten, wenn lediglich eine Speicherung in einem persönlichen Ordner entfernt wird.
- Das lokale User-Profil einschließlich Name beziehungsweise Benutzername, Clerk-ID und Rolle löschen.
- Das zugehörige Clerk-Konto löschen und den Login-Zustand beenden.
- Eine Wiederherstellung über die Anwendung ist nicht vorgesehen.

### Frontend-Anforderung für Dilek: Bestätigungsfenster

- Vor der Kontolöschung ein großes, deutlich sichtbares modales Warnfenster öffnen.
- Titel: **„Konto dauerhaft löschen?“**
- Vorgeschlagener Text:

  > Dein Konto und deine bei Your Meme gespeicherten Profildaten, hochgeladenen Memes,
  > Kommentare, Likes und persönlichen Ordner werden dauerhaft gelöscht. Deine Memes
  > verschwinden auch aus den Ordnern anderer Nutzer. Kommentare und Likes unter deinen
  > Memes werden ebenfalls entfernt. Dein Anmeldekonto wird bei Clerk gelöscht.
  > Diese Aktion kann nicht rückgängig gemacht werden.

- Eine zunächst nicht ausgewählte Checkbox anzeigen:
  **„Ich verstehe, dass mein Konto und die genannten Daten dauerhaft gelöscht werden.“**
- Schaltflächen: **„Abbrechen“** und **„Konto dauerhaft löschen“**.
- Die Löschschaltfläche erst nach Auswahl der Checkbox aktivieren und deutlich als destruktive Aktion kennzeichnen.
- Abbrechen, Schließen oder Escape löst keine Löschung aus.
- Den Fokus zunächst auf „Abbrechen“ setzen; der Dialog muss per Tastatur bedienbar und für Screenreader beschriftet sein.
- Während der Verarbeitung einen Fortschrittszustand anzeigen und wiederholtes Absenden verhindern.
- Erst nach bestätigtem Abschluss Erfolg anzeigen und auf die öffentliche Startseite wechseln.
- Bei Fehlern oder noch laufender Bereinigung den tatsächlichen Zustand verständlich anzeigen; keine erfolgreiche vollständige Löschung behaupten.

### Backend-Anforderungen für die Kontolöschung

- Nur das eigene Konto anhand der verifizierten Clerk-Identität löschen; keine beliebige Nutzer-ID aus dem Request übernehmen.
- Die ausdrückliche Bestätigung zusätzlich im Request prüfen; eine deaktivierte Frontend-Schaltfläche allein genügt nicht.
- Die Löschung der Datenbankeinträge als zusammenhängende Transaktion planen.
- PostgreSQL, Clerk und Bildspeicher können nicht gemeinsam durch eine einzelne Datenbanktransaktion zurückgerollt werden.
- Die Löschung deshalb als wiederholbaren Ablauf planen: betroffene Bildkennungen und Clerk-ID vorab für die Bereinigung sichern, Konto währenddessen für weitere Änderungen sperren und fehlgeschlagene Teilschritte erneut ausführen.
- Benötigte Bereinigungsdaten nur bis zum Abschluss aufbewahren und anschließend entfernen.
- Auch eine außerhalb der Anwendung ausgelöste Clerk-Kontolöschung muss den lokalen Bereinigungsablauf anstoßen können; die konkrete Anbindung wird bei der Clerk-Integration festgelegt.
- Vor Veröffentlichung Löschfristen für Backups und technische Logs separat festlegen; sie werden durch das Entfernen der aktiven Datensätze nicht automatisch bereinigt.

## Gemeinsame Bild-Testdaten

`prisma/test-memes.json` enthält 29 Meme-Vorlagen; `npx tsx prisma/import-test-memes.ts` legt sie in der lokalen Projektdatenbank an. Vorhandene IDs werden übersprungen. Neue Datensätze gehören zum Demo-Nutzer Meme-Testdaten mit künstlicher Clerk-Kennung, nicht zu einem echten Anmeldungskonto. Echte Nutzerkonten, Likes, Kommentare und Ordner werden nicht kopiert. Josephine bestätigt, dass die Anzeige bei Dilek nach dem Import funktioniert. Cloudinary-Adressen werden gemeinsam genutzt; Löschen der Originaldatei betrifft beide Anzeigen.

## Nächste Schritte

1. Bereits implementierten Frontend-Sync vor dem ersten Upload zuverlässig abschließen; lokale UUID aus Sync und Clerk-ID nicht verwechseln.
2. Persönlichen Like-Status in Leseantworten ergänzen; private Ordner und Meme-Zuordnungen umsetzen.
3. Administrator-Löschrechte ausschließlich serverseitig prüfen und Rechtevergabe festlegen.
4. Kontolöschung über PostgreSQL, Clerk und Cloudinary einschließlich wiederholbarer Bereinigung umsetzen; befüllte Löschkaskaden und Teilausfälle testen.
5. Bildaustausch und `altText` sind noch keine implementierten Erweiterungen. Kategorien sind aus dem Pflichtumfang von Version 1 ausgeschlossen.

Validierung, Rechteprüfung, Tests und Dokumentation werden bei jeder Funktion mitgeführt.
Aktueller Stand und Trello-Arbeitsweise: [projektstand.md](projektstand.md).

Projektzeitraum: 27.10.2026 bis 23.11.2026. Der Code wird vom Nutzer selbst geschrieben;
dieses Dokument dient als gemeinsame Planungsgrundlage.

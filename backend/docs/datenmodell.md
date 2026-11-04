# Your Meme – Datenmodell

Stand: 04.11.2026. Mit `prisma/schema.prisma` und der ersten Migration
`prisma/migrations/20261104125318_init/migration.sql` abgeglichen.
Die sechs Modelle, Felder, Beziehungen, Schlüssel und Löschkaskaden sind dort enthalten.
Ob die Migration in der konfigurierten Datenbank angewendet ist, wurde bei dieser Dokumentationsprüfung nicht geprüft.

Die Berechtigungen und dienstübergreifende Kontolöschung in diesem Dokument beschreiben Anforderungen.
Die API setzt sie noch nicht um; Clerk und Bildspeicher sind noch nicht angebunden.

## Technische Grundlage

- Node.js, Express und TypeScript
- PostgreSQL mit Prisma
- Clerk für Registrierung, Anmeldung und Passwortverwaltung
- Dauerhafter Bildspeicher: Anbieter noch offen
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
- **Meme:** Titel, Bildadresse, Kennung der Bilddatei beim Speicherdienst und Ersteller.
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

Geplante Zugriffsregeln für die noch umzusetzenden fachlichen Endpunkte:

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
- Eigentümer- und Administratorrechte werden vor Änderungen serverseitig geprüft.
- Fremde Memes und Kommentare dürfen von Administratoren gelöscht, aber nicht bearbeitet werden.
- Das Backend übernimmt die Identität und Rolle nicht ungeprüft aus dem Request-Body.

## Löschregeln

Die relationalen Löschkaskaden sind in Schema und Migration definiert (`onDelete: Cascade`).
Für ihre Wirkung muss die Migration in der Datenbank angewendet sein.
Bilddateien, Clerk-Konto, Bestätigung und wiederholbare Bereinigung benötigen zusätzliche Anwendungslogik;
diese ist noch nicht implementiert.

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

## Nächste Schritte

1. Datenbeziehungen in kleinen Beispielen nachvollziehen und API-Datenformate mit Dilek abstimmen.
2. PostgreSQL-Verbindung und angewendeten Migrationsstand prüfen; Schema, erste Migrationsdatei und Prisma-Client-Modul sind bereits vorhanden.
3. Einen ersten Datenbankzugriff umsetzen und den Prisma-Client in den benötigten API-Code einbinden.
4. Geplante Meme-Endpunkte umsetzen und ihre Antworten mit Postman prüfen.
5. Clerk, Zugriffsprüfungen und weitere Funktionen schrittweise ergänzen.
6. Vor dem Upload den Bildspeicher auswählen. Nur bei gewünschter Veröffentlichung Hosting auswählen und frühzeitig testen.

Validierung, Rechteprüfung, Tests und Dokumentation werden bei jeder Funktion mitgeführt.
Aktueller Stand und Trello-Arbeitsweise: [projektstand.md](projektstand.md).

Projektzeitraum: 27.10.2026 bis 23.11.2026. Der Code wird vom Nutzer selbst geschrieben;
dieses Dokument dient als gemeinsame Planungsgrundlage.

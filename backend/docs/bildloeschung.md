# Bildzuordnung und wiederholbare Meme-Löschung

Stand: 16.11.2026. Gilt für die Meme-DELETE-Route, nicht für die weiterhin fehlende vollständige Kontolöschung.

## Zuordnung zu Cloudinary

Die fachliche Kategorie liegt ausschließlich in PostgreSQL (`Meme.category`). Cloudinary benötigt dafür weder Kategorienordner noch Tags, Nutzernamen oder Clerk-IDs. Bei einem Upload übernimmt das Backend `secure_url` und die exakte `public_id` aus der Cloudinary-Antwort. `imageStorageId` speichert diese `public_id` einschließlich eines vorhandenen Ordnerpfads. Sie ist die technische Löschkennung und darf nicht aus der Kategorie abgeleitet werden.

Am 16.11. ausschließlich lesend über die Cloudinary Admin API bestätigt und in Import-Fixtures sowie der lokalen Datenbank korrigiert:

| Alte Kennung | Exakte public_id | Bild |
| --- | --- | --- |
| study_2 | study | study.png |
| study_02 | study_2 | study_2.png |
| sport_02 | sport_2 | sport_2.png |
| holiday | Holiday | Holiday.png |

Dabei wurden keine Cloudinary-Dateien gelöscht oder umbenannt. Kategorie, Titel und Bildadresse blieben unverändert. Der Fixture-Test prüft für diese einfachen, versionierten PNG-Adressen die Übereinstimmung von Bildpfad und Speicherkennung; er ist kein allgemeiner Cloudinary-URL-Parser. Für neue Uploads bleibt die Dienstantwort maßgeblich. Erneuter Fixture-Import überspringt vorhandene IDs und repariert deshalb auf anderen Rechnern keine bereits importierten Werte automatisch.

## Ablauf und API-Vertrag

1. Verifizierte Clerk-Identität verwenden, lokales Profil laden und Besitzer oder ADMIN prüfen. Es gibt keinen öffentlichen Zugriff auf Bereinigungsaufträge.
2. In einer PostgreSQL-Transaktion einen `MemeImageDeletion`-Auftrag anlegen und das Meme löschen. Kommentare, Likes und Ordnerzuordnungen werden per Kaskade entfernt; die Ordner selbst bleiben. Scheitert die Transaktion, bleiben Inhalt und Bild bestehen.
3. Erst nach erfolgreichem Commit Cloudinary `destroy` mit `resource_type: image` und `invalidate: true` aufrufen. `ok` und `not found` gelten als erfolgreiche Dateibereinigung.
4. Nach erfolgreicher Dateibereinigung den Auftrag vollständig entfernen. Erst nach erfolgreichem Entfernen des Auftrags antwortet die Route mit 204 ohne Body.
5. Bei Dienstfehler oder fehlgeschlagener Auftragsentfernung bleibt der Auftrag erhalten. Die Route antwortet 503 mit `{"error":"Meme entfernt; die Bildbereinigung ist noch offen und wird erneut versucht."}`. Das Meme ist bereits aus allen Anwendungsabfragen entfernt. Der Client darf diesen Zustand nicht als vollständigen Erfolg darstellen.
6. Ein erneutes DELETE auf dieselbe Meme-ID verarbeitet den Auftrag weiter, wenn der aufrufende Nutzer der frühere Besitzer oder ADMIN ist. Fremde Nutzer erhalten 403; ohne Meme und ohne Auftrag 404.
7. `server.ts` startet einen prozesslokalen Wiederholungsdienst: sofort nach Serverstart und danach jede Minute, höchstens 25 fällige Aufträge je Durchlauf. Fehlversuche werden um eine Minute verschoben. In einem Prozess läuft höchstens ein Durchlauf gleichzeitig. Nach einem Neustart werden gespeicherte Aufträge weiterverarbeitet. Ein beendeter Server führt keine Bereinigung aus; der Betrieb muss offene Aufträge überwachen.

## Datensparsame Verarbeitung und Aufbewahrung

Ein Auftrag enthält ausschließlich `memeId`, `ownerId` (lokale UUID zur Berechtigungsprüfung), `imageStorageId`, `createdAt` und `nextAttemptAt`. Auch diese Kennungen können personenbezogen sein. Titel, Kommentare, Bilddateien, Bild-URLs, E-Mail-Adressen, Clerk-IDs, Tokens und externe Fehlertexte werden nicht kopiert. Der Auftrag wird nach erfolgreicher Bereinigung entfernt; eine Löschhistorie wird nicht zusätzlich gespeichert. Keine User-Fremdschlüsselkaskade: Eine spätere Kontolöschung darf offene Bildaufträge nicht versehentlich verwerfen.

Die Fehlerbehandlung protokolliert feste technische Meldungen statt ungefilterter Prisma-/Cloudinary-Fehlerobjekte. Der Hintergrunddienst schreibt keine Nutzer- oder Bildkennungen in seine Fehlermeldungen. Ab 24 Stunden bleibt ein fehlgeschlagener Auftrag erhalten und erzeugt einen Hinweis auf notwendige manuelle Prüfung. Das ist eine betriebliche Eskalationsschwelle, keine gesetzliche Löschfrist. Der Betreiber muss die Ursache beheben; einfaches zeitgesteuertes Wegwerfen würde die noch ausstehende Bildlöschung vergessen. Aufträge dürfen nur für diesen Zweck zugänglich bleiben.

Diese Umsetzung orientiert sich an Datenminimierung und Speicherbegrenzung aus [Art. 5 DSGVO](https://eur-lex.europa.eu/eli/reg/2016/679/oj) und unterstützt den technischen Löschablauf. Sie ist keine vollständige DSGVO-Abnahme des Projekts. Offene Punkte: vollständige Kontolöschung einschließlich Clerk-Ereignissen, Rechtsgrundlagen und Datenschutzhinweise, Verträge/Einstellungen der eingesetzten Dienste sowie verbindliche Aufbewahrungs- und Löschregeln für DB-Backups, Cloudinary-Backups und Betriebslogs. Die vom Agenten angelegten temporären Datenkopien dürfen nach Ende ihres Sicherungszwecks nicht dauerhaft aufbewahrt werden.

`invalidate: true` fordert die CDN-Invalidierung an; es garantiert keine sofortige Entfernung jeder bereits ausgelieferten Kopie. Aktivierte Cloudinary-Backups können weiterhin eine Wiederherstellung erlauben. Diese Einstellungen wurden hier nicht verändert. Maßgeblich: [Cloudinary Delete assets](https://cloudinary.com/documentation/delete_assets), [Backups](https://cloudinary.com/documentation/backups_and_version_management). Gemeinsam genutzte Fixture-Originale nicht für echte Löschtests verwenden.

## Tests und Grenzen

- `npm test`: 111 erfolgreiche isolierte Tests, ein PostgreSQL-Test standardmäßig übersprungen.
- `RUN_DATABASE_TESTS=1 npm test`: 112 erfolgreiche Tests einschließlich PostgreSQL. Nur auf der lokalen Projektdatenbank `your_meme_db`; der Test erstellt eigene temporäre Datensätze und entfernt sie anschließend.
- Der Datenbanktest prüft Transaktions-Rollback, befüllte Kaskaden, dauerhaften Auftrag nach Dienstfehler und Wiederholung durch eine neue Service-Instanz. Cloudinary/Clerk sind simuliert. Keine echten Bildlöschungen oder echte Browser-Anmeldung behauptet.
- Neue Uploads liefern `likedByMe: false` ohne weitere Like-Abfrage; ein nachträglicher Leseausfall kann den erfolgreichen Upload deshalb nicht mehr als Fehler darstellen.
- Echte Prisma-Fehler P2025 werden als 404, P2003/P2002 als 409 beantwortet. Andere Fehler bleiben 500 ohne Datenbankdetails. Ein Konflikt erfordert gegebenenfalls Neuladen/Wiederholung.
- Scheitert nach einem Upload die DB-Anlage, wird weiterhin versucht, das neue Bild direkt zu entfernen. Bei gleichzeitigem DB- und Cloudinary-Ausfall ist diese Upload-Bereinigung noch nicht dauerhaft abgesichert. Die neue Warteschlange deckt den beauftragten Meme-DELETE-Ablauf ab.

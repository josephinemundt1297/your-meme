# Your Meme – Backend-Spezifikation

## Zweck und Geltungsbereich

- Dieses Dokument beschreibt ausschließlich das Backend und seine Schnittstelle zum Frontend.
- Ziel: eine verständliche REST-API für eine Meme-Plattform.
- Backend-Verantwortung: Josephine; Frontend-Schwerpunkt: Dilek.
- Leitlinie: **Kein Overengineering. KISS-Prinzip.** Nur benötigte Techniken einsetzen.
- Der Nutzer schreibt den Anwendungscode selbst; Umsetzung und Erklärungen erfolgen schrittweise.
- Änderungen durch Chaty erfolgen nur nach ausdrücklicher Freigabe im beschriebenen Umfang. Unklare Anweisungen werden vor der Änderung nachgefragt; zusätzliche Anforderungen oder Fortschritte werden nicht erfunden.
- Die Git-Branches `Backend`, `Frontend` und `main` sind bereits vorhanden. Zusammenführen, Commit und Push erfolgen nur auf ausdrücklichen Auftrag.
- Abgabe: 23.11.2026. Deployment ist freiwillig.

## Festgelegte Technologien

- Node.js und Express für die API.
- TypeScript für den Backend-Code.
- PostgreSQL für dauerhafte Datenhaltung.
- Prisma für Datenmodell, Migrationen und Datenbankzugriffe.
- Clerk für Registrierung, Anmeldung und Passwortverwaltung.
- Cloudinary als Bildspeicher; Hosting optional und noch offen.
- Unterrichtsgrundlagen für Validierung und Tests: Zod, Postman, Jest und Supertest; schrittweise nach Bedarf einrichten.

## Umsetzungsstand am 11.11.2026

Diese Spezifikation beschreibt den vereinbarten Zielumfang; Anforderungen sind keine Erledigt-Meldungen.

- Express, PostgreSQL/Prisma, öffentliche Meme-/Detail-/Kommentarabfragen sowie Clerk-Prüfung und lokale Nutzer-Synchronisation sind implementiert.
- Vollständiger PNG-Upload nach Cloudinary und PostgreSQL (201), eigener Meme-Titel bearbeiten und eigene Memes einschließlich Bild löschen sind implementiert; Erstellerprüfung vorhanden.
- Kommentare erstellen, eigene bearbeiten/löschen und eigene Likes setzen/entfernen sind implementiert. Kommentartext getrimmt 1–1000 Zeichen, Meme-Titel 1–100 Zeichen.
- Frontend lädt Liste, Detail und Kommentare; schreibende Anbindung und automatischer Sync fehlen im geprüften Stand. API-Leseantworten enthalten noch keinen persönlichen Like-Status.
- Offen: Ordner, Administrator-Moderation, Kontolöschung, Pagination, Missbrauchsbegrenzung, zentrale JSON-Fehlerbehandlung und vollständige Tests. Cloudinary-/DB-Teilausfälle sind noch nicht dauerhaft wiederholbar abgesichert.
- Backend-Typprüfung/Build, Prisma-Validierung und Frontend-Lint/Build erfolgreich. Live-Prüfungen und gewichtete Bewertung (Backend ca. 65 %, Frontend ca. 45 %, gesamt ca. 55 %): [Projektstand](docs/projektstand.md). Keine automatisierte Backend-Testsuite eingerichtet.

## Funktionen und Zugriffsrechte

- Besucher können Memes ansehen und Meme-Links teilen.
- Angemeldete Nutzer können eigene Memes hochladen, bearbeiten und löschen.
- Nutzer können Memes liken und ihre eigenen Likes entfernen.
- Nutzer können Kommentare schreiben sowie eigene Kommentare bearbeiten und löschen.
- Nutzer können persönliche Ordner erstellen und Memes darin speichern beziehungsweise daraus entfernen.
- Persönliche Ordner sind nur für ihren Besitzer zugänglich.
- Administratoren können fremde Memes und Kommentare zur Moderation löschen, aber nicht bearbeiten.
- Administratorrechte werden ausschließlich über einen vertrauenswürdigen serverseitigen Prozess vergeben.
- Angemeldete Nutzer können ihr eigenes Konto nach ausdrücklicher Bestätigung dauerhaft löschen.

## Datenhaltung

- Modelle: User, Meme, Comment, Like, Folder und FolderMeme.
- Lokale Nutzer werden über eine eindeutige Clerk-ID dem verifizierten Clerk-Konto zugeordnet.
- Keine Passwörter in der Anwendungsdatenbank speichern.
- Ein Like pro Nutzer und Meme; ein gespeichertes Meme pro Ordner.
- Bilddateien liegen im Bildspeicher; Bildadresse und Speicherkennung liegen beim Meme in PostgreSQL.
- Das vollständige Modell und seine Beziehungen stehen in [docs/datenmodell.md](docs/datenmodell.md).

## API-Planung

- Schnittstellen vor der Umsetzung mit dem Frontend abstimmen.
- Bereits geplante Meme-Endpunkte stehen in [docs/api-plan.md](docs/api-plan.md).
- Kommentar- und Like-Endpunkte sind implementiert; Ordner, Moderation und Kontolöschung werden noch konkretisiert.
- Aussagekräftige HTTP-Methoden und Statuscodes sowie konsistente JSON-Antworten verwenden.
- Meme-Listen seitenweise ausliefern und die angeforderte Seitengröße begrenzen.
- Anfrage- und Antwortformate einschließlich Fehlerfällen vor der Frontend-Anbindung dokumentieren.
- Teilen erfolgt über einen Link; ein zusätzlicher Backend-Endpunkt ist dafür zunächst nicht vorgesehen.

## Kontolöschung

- Eigene Memes einschließlich Bilddateien löschen.
- Zugehörige Kommentare, Likes und Ordnerzuordnungen ebenfalls entfernen, auch von anderen Nutzern.
- Eigene Kommentare, Likes, persönliche Ordner und lokale Profildaten löschen.
- Clerk-Konto löschen und den Login-Zustand beenden.
- Fremde Memes bleiben beim Löschen eigener Ordner erhalten.
- Datenbank und externe Dienste müssen beim Löschen abgestimmt behandelt werden; Teilausfälle dürfen nicht als vollständiger Erfolg erscheinen.
- Details stehen im Datenmodell.

## Schnittstellenanforderung für Dilek: Kontolöschung

- Vor der Kontolöschung ein großes, deutlich sichtbares Bestätigungsfenster anzeigen.
- Folgen erläutern: Konto, Profildaten, Uploads, Kommentare, Likes und Ordner werden dauerhaft gelöscht.
- Auch auf das Entfernen eigener Memes aus fremden Sammlungen und der zugehörigen Interaktionen hinweisen.
- Eine zunächst nicht ausgewählte Bestätigungscheckbox verlangen.
- Schaltflächen: „Abbrechen“ und „Konto dauerhaft löschen“; Löschen erst nach Bestätigung ermöglichen.
- Tastaturbedienung und verständliche Beschriftung berücksichtigen.
- Das Backend prüft Identität und Bestätigung unabhängig vom Frontend.
- Dies ist eine gemeinsame Funktionsanforderung; darüber hinaus legt diese Datei keine Frontend-Architektur fest.

## Qualität und Sicherheit

- Eingaben zur Laufzeit prüfen; TypeScript allein validiert keine HTTP-Requests.
- Identität über Clerk und Eigentümer- beziehungsweise Administratorrechte serverseitig prüfen.
- CORS passend zum Frontend konfigurieren; CORS ersetzt keine Berechtigungsprüfung.
- Missbrauchsanfällige Endpunkte durch angemessene Begrenzungen schützen.
- Neue Uploads: genau ein PNG bis 5 × 1024 × 1024 Bytes, Textfeld title und Dateifeld image. MIME-Vorprüfung und Signaturerkennung vorhanden; vollständige Fehlerfalltests offen. Die frühere JPG-Idee wurde zugunsten von PNG ersetzt.
- Keine Geheimnisse, Passwörter oder internen Fehlerdetails in API-Antworten ausgeben.
- Zugangsdaten über Umgebungsvariablen verwalten und aus Git ausschließen.
- Verständliche Modulstruktur und zentrale Fehlerbehandlung verwenden, ohne unnötige Abstraktionen.
- Wichtige Erfolgsfälle, ungültige Eingaben und Zugriffsverletzungen testen.
- Einrichtung, Konfiguration, Start und Tests dokumentieren.
- Git und ein einfaches Aufgabenboard für die Zusammenarbeit verwenden.

## Noch offen

- Persönlicher Like-Status beim Laden, Pagination, Missbrauchsbegrenzung und sichere zentrale Fehlerantworten.
- Persönliche Ordner, Administrator-Moderation und vollständige Kontolöschung.
- Dauerhafte Behandlung von Cloudinary-/Datenbank-Teilausfällen.
- Ob beim Bearbeiten eines Memes neben dem Titel auch das Bild ersetzt werden kann.
- Automatischer Aufruf der vorhandenen Nutzer-Synchronisation aus dem Frontend nach Clerk-Anmeldung.
- Technische Einzelheiten der Kontolöschung über Datenbank, Clerk und Bildspeicher.
- Vollständige API-Verträge und Testfälle.
- Optionales Hosting; keine Voraussetzung für die Abgabe.
- Weitere Funktionen wie Suche, Kategorien oder Meme-Editor sind nicht Bestandteil der ersten Version.

## Nächster Arbeitsschritt

- Persönlichen Like-Status für das Frontend ergänzen und Parser-/Middlewarefehler als sichere JSON-Antworten behandeln.
- Persönliche Ordner und Meme-Zuordnungen ausschließlich für den Besitzer umsetzen.
- Parallel Frontend: automatischer Sync, echter Upload, Autor übernehmen sowie Kommentar-/Like-Aktionen und eigene Meme-Verwaltung anbinden.
- Danach Moderation und Kontolöschung einschließlich Teilausfällen; abschließende Rechte-, Integrations- und Abnahmetests.
- Validierung, Tests und Dokumentation mitführen. [Projektstand](docs/projektstand.md) enthält Belege und Grenzen.

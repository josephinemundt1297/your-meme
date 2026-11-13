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

## Backend-Architektur

- Fachliche Module für Memes einschließlich Likes, Kommentare, Ordner und Nutzer.
- Routen ordnen Methoden und Pfade zu. Controller lesen und validieren HTTP-Eingaben und erzeugen Antworten. Services enthalten fachliche Abläufe, Rechteprüfungen und Datenzugriffe ohne Express-Request/-Response.
- `app.ts` verbindet Module und Middleware; `server.ts` stellt die echten Dienste bereit und startet den Server. Kleine Statusrouten benötigen keinen zusätzlichen Service.
- Bestehende Validatoren, Hilfsfunktionen und Dienstanbindungen bleiben gemeinsam nutzbar. Keine zusätzliche Repository-Schicht ohne konkreten Bedarf.
- Die Aufteilung verändert keine vereinbarten API-Pfade, Antwortformate oder Zugriffsrechte. Beschreibung und Prüfgrenzen: [Architektur](docs/architektur.md).

## Historischer Umsetzungsstand am 12.11.2026

Diese Spezifikation beschreibt den vereinbarten Zielumfang; Anforderungen sind keine Erledigt-Meldungen.

- Meme-/Kommentar-/Like-Aktionen sowie Cloudinary-Upload/-Löschung und Clerk-Sync sind implementiert. Öffentliche GET-Liste und Detail liefern jetzt likedByMe; Frontend muss dafür Token mitsenden.
- Ordner erstellen, eigene auflisten/ansehen, Memes hinzufügen und Zuordnungen entfernen sind vorhanden. Umbenennen, ganzen Ordner löschen und Zwei-Konten-Abnahme fehlen.
- JSON-Parserfehler werden zentral als sichere JSON-Antworten behandelt; Live-Tests 400/413 erfolgreich.
- Frontend: Upload wartet auf Sync; Kommentarformular und Like-/Unlike-Schreibaktionen sind angebunden. Eigene Bearbeiten-/Löschaktionen, Ordner-UI und persönlicher Like-Status beim erneuten Laden noch offen.
- Offen: Admin-Moderation, vollständige Kontolöschung, Pagination, Missbrauchsbegrenzung, Teilausfallbehandlung und vollständige Integration/Tests.
- Backend typecheck/build, Prisma validate, Frontend lint/build erfolgreich. Gewichtete gerundete Schätzung: Backend ca. 75 %, Frontend ca. 65 %, gesamt ca. 70 %. [Belege und Bewertungsmethode](docs/projektstand.md).

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
- Meme-, Kommentar-, Like- und Ordner-Endpunkte einschließlich Umbenennen/Löschen sind implementiert. ADMIN kann fremde Memes/Kommentare löschen. Vollständige Kontolöschung fehlt noch.
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

- Vollständige Kontolöschung einschließlich Bestätigung, Schutz vor parallelen Änderungen und wiederholbarer Bereinigung.
- Reale angemeldete Schreibaktionen nach der Backend-Aufteilung erneut abnehmen; vollständige Zwei-Konten- und Kaskadentests bleiben gesonderte Abnahmen.
- Meme-Pagination und lokale Anfragebegrenzung sind vorhanden; Frontend-Seitennavigation, Limits unter realen Einsatzbedingungen und vollständige Integration bleiben zu prüfen. Persönlicher Like-Status wird inzwischen in Übersicht und Detail mit Token geladen.
- Dauerhafte Behandlung von Cloudinary-/Datenbank-Teilausfällen.
- Ob beim Bearbeiten eines Memes neben dem Titel auch das Bild ersetzt werden kann.
- Upload wartet bereits auf Sync; weitere Erstlogin-/Fehlerfälle der Kommentar-/Like-Aktionen und des Layout-Sync prüfen.
- Technische Einzelheiten der Kontolöschung über Datenbank, Clerk und Bildspeicher.
- Vollständige API-Verträge und Testfälle.
- Optionales Hosting; keine Voraussetzung für die Abgabe.
- Weitere Funktionen wie Suche, Kategorien oder Meme-Editor sind nicht Bestandteil der ersten Version.

## Nächster Arbeitsschritt

1. Kurze angemeldete Abnahme nach der Aufteilung: mit einem separaten eigenen Test-Meme Upload, Titeländerung, Like/Unlike, Kommentarverwaltung und einen Testordner prüfen. Nur eigens angelegte Testinhalte löschen. Die 72 automatisierten Tests simulieren externe Dienste; die bisherige reale Nachprüfung war lesend.
2. **Höchste fachliche Priorität: vollständige Kontolöschung.** Zuerst Vertrag, Bestätigung, betroffene Daten und Verhalten bei Teilausfällen festlegen und Josephine vorlegen. Die konkrete Route, neue Persistenz und Umsetzung sind damit noch nicht freigegeben.
3. Nach Freigabe im Nutzer-Modul umsetzen: Identität und Bestätigung im Controller, Löschablauf im Service, bestehende Dienstanbindungen verwenden. Externe Löschungen lassen sich durch eine PostgreSQL-Transaktion nicht zurückrollen. Fehlgeschlagene Schritte müssen nachvollziehbar wiederholbar bleiben; keine vollständige Löschung melden, solange Teile fehlen.
4. Mit Testdoubles Erfolgs-, Rechte-, Bestätigungs-, Ausfall- und Wiederholungsfälle prüfen; anschließend ausschließlich mit einem entbehrlichen Testkonto real abnehmen. Gemeinsame Cloudinary-Fixtures nicht für Löschtests verwenden.
5. Danach verbleibende Absicherung und vollständige Integration abarbeiten. Die Backend-Meme-Pagination ist vorhanden; die Frontend-Navigation dafür fehlt noch. Frontend-Aufgaben richten sich nach dem tatsächlich vorhandenen Stand; keine bereits erledigten Funktionen erneut bauen.

[Projektstand](docs/projektstand.md) dokumentiert Belege und Grenzen. Kategorien/Suche/Editor bleiben außerhalb des Pflichtumfangs.

# Your Meme – Projektstand und Arbeitsweise

## Aktueller Nachtrag vom 16.11.2026 – Backend bereinigt

Auf Josephines ausdrücklichen Auftrag ausschließlich das Backend bereinigt, ohne neue Pakete oder zusätzliche Architekturschichten:

- Upload-Schema prüft nur die tatsächlichen Formularfelder Titel/Kategorie. Bildadresse und Speicher-ID werden weiterhin ausschließlich vom Cloudinary-Ergebnis übernommen; API-Verhalten bleibt erhalten.
- Ungenutzten Pagination-Typ und unnötigen Schema-Export entfernt. Die lokale Variable `listQuery` bezeichnet nun passend Kategorie und Seiteneinstellungen. Unbenutzte Request-Parameter markiert; Bildbereinigung, Meme-Service und Serverstart lesbarer formatiert. Gewünschte Erklärungen zu Zod/enum/infer beibehalten.
- Node-Anforderung in package.json und Lockdatei auf die bereits verwendete Version ab 24 angeglichen; keine Abhängigkeiten aktualisiert. Generierten Installationskommentar aus der Prisma-Konfiguration entfernt.
- Datenbank-Healthcheck protokolliert keine rohen Fehlerobjekte mehr. Bestehenden Datenschutz-Regressionstest um einen Datenbankausfall mit vertraulichem Fehlerinhalt erweitert; HTTP-Status und Antwortformat bleiben erhalten.
- README, API-Vertrag, Architektur und Datenmodell auf den aktuellen Stand zusammengeführt. Widersprüchliche alte Kategorienlisten, lokale Einrichtungsanweisungen und überholte Testzahlen aus den aktuellen Anleitungen entfernt. Historische Nachträge unten bleiben als Prüfbelege erhalten. SPECK nur an diesen belegten Dokumentationsstand angepasst; keine neuen Anforderungen ergänzt.

Prüfung: Typprüfung einschließlich `--noUnusedLocals --noUnusedParameters`, Prisma-Schemavalidierung und `git diff --check` erfolgreich. `npm test`: **105 erfolgreich, 2 lokale PostgreSQL-Tests bewusst übersprungen, 0 fehlgeschlagen**. HTTP-Tests benötigten lokale Serverports außerhalb der Sandbox; externe Dienste wurden simuliert. Kein erneuter Datenbank-Integrationstest und keine Live-Schreib-/Löschabnahme. Keine Migration ausgeführt, keine gemeinsamen Daten oder Zugangsdaten geändert, keine Frontend-Dateien geändert. Kein Commit, Push oder Merge.

## Vorheriger Nachtrag vom 16.11.2026 – Neon aktiv und Kategorien vollständig deutsch

Josephine hat die vollständige Übertragung von 3 Profilen einschließlich Clerk-IDs, 30 Meme-Einträgen, 1 Kommentar, 1 Like und 2 Ordnern nach Neon Frankfurt freigegeben. Projekt `your-meme` (`ancient-scene-53479819`) im bestehenden Konto neu angelegt: Free-Tarif, Frankfurt, PostgreSQL 18.7. Keine anderen Projekte verändert.

Zusätzlich ausdrücklich freigegeben: Dileks verkürzte Liste vollständig eindeutschen. Gültig sind Arbeit, Programmieren, Kaffee, Tiere, Essen, Lernen, Spiele, Zuhause, Wochenende plus Ohne Kategorie. Nur Animal→Tiere, Food→Essen, Study→Lernen, Gaming→Spiele und Meeting→Arbeit übernommen; Arbeit/Programmieren erhalten. Alle übrigen gestrichenen Kategorien wurden gemäß Rückmeldung Ohne Kategorie. Neue atomare Migration `20261116180000_german_categories`, Backend-Validator und unabhängige Kategorie-Tests angepasst. Kein Frontend geändert. 107 Tests einschließlich zweier lokaler PostgreSQL-Tests erfolgreich; die Anzahl sinkt wegen der ausdrücklich verkürzten Kategorienliste.

Lokales Backend kurz gestoppt, Projekt-Tabellen während frischem Export und Abgleich gegen Schreiben gesperrt. Dump atomar auf leeres Neon-Ziel übernommen. Alle Daten und die Historie von 4 Migrationen vollständig verglichen. Verbindung TLS 1.3 mit gültigem Zertifikat geprüft; DATABASE_URL nur in lokaler geschützter Backend-Konfiguration geändert. Backend wieder gestartet. Live-Abnahme: Health und DB-Health 200; Meme-Liste 30; Arbeit 3, Tiere 2, Spiele 2, Kaffee 0; Animal erwartungsgemäß 400. Migrationsstatus aktuell, keine offenen Bildaufträge. Keine echte neue Bildübertragung/Löschung als Teil dieses Umzugs. Lokale Quelle und geschütztes finales Rückfallarchiv bleiben vorerst erhalten.

Aktuelle Kategorienverteilung: Arbeit 3, Essen 2, Lernen 2, Programmieren 3, Spiele 2, Tiere 2, Ohne Kategorie 16. Kaffee/Zuhause/Wochenende noch leer; keine inhaltliche Vermutung bei der Umklassifizierung.

Josephine hat danach die zwei konkreten dauerhaften Backend-Zugänge ausdrücklich freigegeben. Rolle a für ihr Backend und Rolle b für Dilek angelegt: CRUD auf Projekttabellen, SELECT auf Migrationshistorie, keine Schema-Erstellung. Beide Verbindungen zertifikatsgeprüft; Josephines Backend neu mit Rolle a gestartet. Migrationszugang separat in DIRECT_DATABASE_URL, Prisma-Konfiguration mit abwärtskompatiblem Fallback angepasst. Dileks Verbindung nur in lokaler Git-ignorierter `.env.dilek.local` (600), keine Geheimnisse in versionierter Dokumentation. Gemeinsames Schreiben/Lesen zwischen Rolle b und HTTP-API von Rolle a mit eigenem temporärem Datensatz tatsächlich geprüft; Testdaten vollständig entfernt, wieder 30 Memes. Keine Nachricht an Dilek versendet. [Anschluss und offene Abnahme](gemeinsame-datenbank.md). Kein Commit, Push oder Merge; Backend-Codeänderungen müssen nach Prüfung regulär geteilt werden.

## Vorheriger Nachtrag vom 16.11.2026 – gemeinsames Datenbankziel vorbereitet

Josephine hat den Umzug auf eine gemeinsam gehostete PostgreSQL-Datenbank beauftragt. Vorgeschlagen: Neon Free, Frankfurt, PostgreSQL 18. Anbieter-Verbindung und Bestätigung, welche personenbezogenen Daten übertragen werden dürfen, stehen noch aus. Noch kein Cloud-Projekt erstellt, keine Daten übertragen und keine Backend-Konfiguration umgestellt.

Lokale Quelle lesend geprüft: PostgreSQL 18.6, ungefähr 8,5 MB; 3 Profile, 30 Memes, 1 Kommentar, 1 Like, 2 Ordner, keine FolderMeme-Zuordnungen und keine offenen Bildlöschaufträge. Geschützten lokalen pg_dump-Snapshot erstellt (Custom-Archiv, 17.321 Bytes), Inhaltsliste mit pg_restore geprüft. Das ist noch kein Wiederherstellungstest. Vor finalem Import Schreibpause und frischer Abzug nötig; lokale Quelle bleibt vorerst erhalten.

[Konkreter Ablauf, Datenumfang und Prüfgrenzen](gemeinsame-datenbank.md). Nur Backend-Dokumentation ergänzt; kein Anwendungscode, keine Abhängigkeiten oder Frontend-Dateien geändert. Kein Commit, Push oder Merge.

## Vorheriger Nachtrag vom 16.11.2026 – freigegebene Review-Korrekturen

Josephine hat die vier Befunde ausdrücklich zur Behebung freigegeben, mit besonderem Augenmerk auf Datenschutz. Ausschließlich Backend, Backend-Tests, Migration und Backend-Dokumentation geändert. Keine Frontend-Dateien, neuen Pakete, Commits, Pushes oder Merges.

- Cloudinary Admin API ausschließlich lesend zur Bestätigung exakter public_ids verwendet. `study_2` → `study` beim ersten Lern-Meme, `study_02` → `study_2`, `sport_02` → `sport_2`, `holiday` → `Holiday`. Fixtures und lokale DB korrigiert. Alle Kategorien, Titel und Bildadressen unverändert; 30 zu diesem Prüfzeitpunkt vorhandene Memes blieben erhalten. Keine echten Cloudinary-Dateien geändert/gelöscht.
- Neue Uploads liefern direkt likedByMe false. Eine nachträgliche Like-Abfrage kann einen erfolgreichen Upload nicht mehr als 500 darstellen.
- Meme-DELETE: Transaktion für minimalen Auftrag und Inhaltslöschung; dann Cloudinary und Auftragsentfernung. Bei Ausfall 503 mit ehrlicher Meldung und persistentem Auftrag, statt öffentlich sichtbarem Meme ohne Bild. Besitzer/ADMIN dürfen wiederholen; automatischer Dienst startet mit Server und prüft jede Minute maximal 25 fällige Aufträge.
- Nur fünf Auftragsfelder, keine Inhalts-/Kontaktdatenkopien und keine rohen externen Fehlerobjekte in den Fachcontroller-Logs. Aufträge nach Erfolg entfernt; ab 24 Stunden ungelöstem Fehler betrieblicher Hinweis zur manuellen Prüfung, keine automatische Aufgabe der externen Löschung. CDN-/Backup-Fristen und volle Kontolöschung bleiben offen.
- Echte Prisma-P2025 → 404, P2003/P2002 → 409; sichere Fehlermeldungen für gleichzeitige Änderungen.
- Neue Migration `20261116160000_add_image_deletion_jobs` lokal auf `your_meme_db` angewendet; Migrationsstatus aktuell. Schema validiert, Client erzeugt, Typprüfung und Build erfolgreich.
- `RUN_DATABASE_TESTS=1 npm test`: **112 Tests erfolgreich**, einschließlich PostgreSQL-Test für Transaktions-Rollback, befüllte Kaskaden und Wiederholung mit neuer Service-Instanz. Eigene temporäre Testdaten danach vollständig entfernt, keine Testnutzer/Bereinigungsaufträge zurückgelassen. Ohne Opt-in läuft der DB-Test nicht (111 Tests erfolgreich, einer übersprungen). Clerk/Cloudinary dabei simuliert; keine echte Browser-/Clerk-/Cloudinary-Löschabnahme.

[Ablauf, Datenschutzquellen und Grenzen](bildloeschung.md). Vollständige Kontolöschung ist weiterhin ein eigener offener Auftrag. Nachfolgende Tagesstände sind historische Momentaufnahmen.

## Vorheriger Nachtrag vom 16.11.2026 – vorhandene Memes zugeordnet

Josephine hat die Zuordnung vorhandener Daten ausdrücklich beauftragt und `imageStorageId` als Grundlage festgelegt (Beispiel `food_2` → `Food`). Auf der lokalen Datenbank `your_meme_db` wurden 29 bisher nicht zugeordnete Meme-Einträge innerhalb einer Transaktion aktualisiert. Nummernsuffixe wie `_2`, `_02` und `_3` gehören zum Bildnamen; der Grundname bestimmt die Kategorie. `movie` wird zu `Movies`, `drink`/`drinks` zu `Drinks` und `books` zu `Book`. Die bestehenden Kategorienamen mit Großschreibung bleiben erhalten.

| Kategorie | Anzahl |
| --- | ---: |
| Ohne Kategorie | 4 |
| Programmieren | 3 |
| Alltag | 1 |
| Arbeit | 1 |
| Sport | 2 |
| Gaming | 2 |
| Tech | 3 |
| Animal | 2 |
| Movies | 2 |
| Outdoor | 2 |
| Study | 2 |
| Drinks | 3 |
| Food | 2 |
| Holiday | 1 |
| Book | 1 |
| Meeting | 2 |

Die vier zufälligen `your-meme/...`-Kennungen (`test3`, `test2`, `TestRick` und `Dieser Titel darf nicht gespeichert werden`) erlauben keine Zuordnung anhand von `imageStorageId` und bleiben ausdrücklich `Ohne Kategorie`. Keine Zuordnung nach Titel oder Bildinhalt vorgenommen.

Prüfung: alle 33 Meme-Einträge vor/nach der Änderung verglichen. Fachlich nur `category` geändert; Prisma aktualisiert dabei auch `updatedAt`. Titel, Bildadresse, `imageStorageId`, Ersteller, IDs und Erstellungszeitpunkte unverändert. Anzahl weiterhin 33. Alle 16 Kategorie-Abfragen einschließlich `Ohne Kategorie` über den tatsächlichen Meme-Service gegen PostgreSQL geprüft: erwartete Anzahl, ausschließlich passende Kategorien und korrektes Seitenende. Keine neue Browser-/Clerk-Abnahme. Cloudinary nicht verändert. Ausgangsstand vor dem Schreiben lokal unter `/tmp/your-meme-categories-before-1794830021344.json` gesichert.

Dies ist eine lokale Datenpflege, keine neue Migration und keine automatische Kategorieerkennung für spätere Uploads. Dileks getrennte Datenbank und die versionierten Import-Fixtures wurden nicht verändert; Git überträgt diese lokale Zuordnung nicht. Die Frontend-Übergabe des vorhandenen Kategorie-Parameters bleibt erforderlich. Kein Commit, Push oder Merge.

## Vorheriger Nachtrag vom 16.11.2026 – Kategorien im Backend

Auf Josephines ausdrückliche Freigabe nach Prüfung des vorhandenen Menüs ausschließlich Backend, Migration, Tests und Backend-Unterlagen auf Branch `Backend` bearbeitet. Ausgangscommit `d7a6cb4` enthält den Frontend-Merge #50. Keine Frontend-Dateien, Abhängigkeiten oder externen Konten geändert; kein Commit, Push oder Merge ausgeführt.

Umgesetzt:

- Eine Kategorie je Meme als Pflichtfeld mit Standard `Ohne Kategorie`. Feste Werte entsprechen den 15 vorhandenen Menüpunkten plus neutralem Standard. Zod-Validierung und Datenbank-CHECK statt zusätzlicher Tabelle.
- Bestehendes `GET /api/memes` um optionales `category` ergänzt: exakte Namen wie `Alltag`, Filter in PostgreSQL vor Pagination. Array und Seiten-Header unverändert, unbekannte/leere/mehrfache Kategorien 400.
- Multipart-Upload nimmt `category` entgegen; ohne Feld bleibt der bisherige Client mit Standardwert nutzbar. Keine automatische Erkennung aus Bildern oder Titeln.
- Bestehendes PATCH erlaubt dem Besitzer `title` und/oder `category`, mindestens eines; Titeländerung setzt die Kategorie nicht zurück. Fremde Inhalte bleiben auch für ADMIN gegen Bearbeitung geschützt.
- Alle Meme-Antworten einschließlich Ordnerinhalten enthalten `category`.
- Migration `20261116093000_add_meme_category` auf der geprüften lokalen Datenbank `your_meme_db` angewendet. Migrationsstatus anschließend aktuell. Alle 33 vorgefundenen Memes erhielten `Ohne Kategorie`; keine fachliche Nachsortierung vorgenommen.

Prüfung: Prisma-Client erzeugt, Schema validiert, Backend-Typprüfung und Build erfolgreich. 79 HTTP-Tests bestanden (72 bisherige plus 7 neue Kategorie-Tests) mit simulierten Diensten. Zusätzlich echter PostgreSQL-/HTTP-Test mit neuen Testdatensätzen innerhalb zurückgerollter Transaktionen: Filter vor Pagination, Kategorieänderung durch Besitzer, Titel-only-Erhalt, DB-Standardwert und SQL-CHECK erfolgreich. Testserver beendet; Meme-Anzahl anschließend unverändert 33. Clerk/Cloudinary dabei nicht aufgerufen, Authentifizierung simuliert; keine authentifizierte Browser-Abnahme behauptet.

Ergänzender Auftrag am 16.11.: alle 15 Menükategorien nochmals mit dem bestehenden Frontend abgeglichen (nur lesend). Die vorhandene Backend-Liste und die SQL-Migration enthalten bereits alle Werte. Für jede Kategorie und `Ohne Kategorie` einen eigenen HTTP-Test für öffentlichen Filter, Pagination und nachträgliche Zuordnung ergänzt. Gesamtergebnis nun 95 bestandene Tests; Upload für alle Kategorien ebenfalls abgedeckt. Keine zusätzliche Datenbankänderung notwendig. Ausschließlich Dateien unter `backend/` geändert.

Review-Korrekturen am 16.11. (ausdrücklich freigegeben):

- Unabhängige erwartete Liste der 15 Menükategorien plus `Ohne Kategorie` in den Tests ergänzt. API-Liste und SQL-CHECK der Kategorie-Migration werden jeweils mit diesem Vertrag verglichen. Die einzelnen HTTP-Tests und Upload-Prüfungen verwenden die erwartete Liste; das versehentliche Entfernen einer Kategorie aus dem Anwendungscode entfernt damit keinen Testfall mehr.
- Die simulierte Datenbank hält Kategorie-Werte pro Meme-ID. PATCH, Detail und Listen lesen dadurch dieselben Werte; andere Memes behalten ihre Zuordnung.
- Neuer Regressionstest: zwei Alltag-Memes und ein Sport-Meme; ein Alltag-Meme nach Gaming verschieben. Es verschwindet aus Alltag, erscheint in Gaming und lässt die anderen beiden Einträge unverändert. Dieser Test scheiterte vor der Korrektur am beschriebenen Fehler und besteht danach.
- Gesamte Backend-Suite einschließlich Build: **98 Tests bestanden**. Dienste simuliert; keine neue PostgreSQL-, Clerk-, Cloudinary- oder Browser-Abnahme. Diese Korrektur betrifft ausschließlich Backend-Tests und Backend-Dokumentation; Anwendungscode und Migration bleiben unverändert. Kein Commit, Push oder Merge.

Frontend bleibt offen: vorhandenen Parameter `/?category=Alltag` an die API weiterreichen, bei Kategorienwechsel Seite 1 laden, „Alle“ ohne Filter und Upload-Auswahl ergänzen. Die Menüroute existiert bereits und wurde nicht neu angelegt. Dileks lokale DB benötigt ebenfalls die neue Migration. Kategorien sind eine zusätzlich freigegebene Erweiterung; Kontolöschung und bestehende Abnahmepunkte bleiben offen.

## Vorheriger Nachtrag vom 13.11.2026 – Backend-Bereinigung und Begrenzung

Part 1 wurde vor Umsetzung vorgeschlagen und von Josephine ausdrücklich freigegeben. Part 2 war für Backend-Punkte freigegeben. Ausschließlich auf Branch Backend gearbeitet; keine Frontend-Dateien, Migrationen oder Abhängigkeiten geändert. Kein Commit, Push oder Merge ausgeführt.

Umgesetzt:

- Gemeinsame requireAuth-Middleware für alle geschützten Routen; verifizierte Clerk-ID aus res.locals. Besitzer-/ADMIN-Prüfungen bleiben in Services und wurden nicht erweitert.
- Gemeinsamer handleRequest-Wrapper statt wiederholter try/catch-Blöcke in Fachcontrollern; bisherige öffentliche Fehlertexte und Statuscodes bleiben erhalten. Health behält seine besondere 503-Antwort.
- Ausführbaren Validator-Beispielcode entfernt, JPNG zu PNG korrigiert und betroffene Controller übersichtlich formatiert.
- likedByMe auch in Meme-POST/PATCH und Ordner-Memes ergänzt. Persönliche Likes für eine Liste werden gemeinsam geladen, nicht einzeln pro Meme. Eine fremde Ordneranfrage wird vor der Like-Abfrage abgewiesen.
- GET /api/memes mit validiertem page/limit, Standard 1/50, maximal page 10000 und limit 100. Array-Antwort bleibt bestehen; Folgeseite über X-Has-More. Nur page und limit als Query-Felder erlaubt. Sortierung createdAt/id absteigend. Kommentar-/Ordnerlisten nicht paginiert; Frontend zeigt weiterhin die erste Seite und benötigt Navigation.
- Prozesslokale IP-Begrenzung: 300 API-/60 Schreib-/10 Upload-Anfragen pro 60 Sekunden, OPTIONS ausgenommen. Vor JSON-Parser und Clerk; 429 mit Retry-After. Maximal 10000 IP-Einträge je Limiter, bei voller Tabelle für neue Clients 503. Neustart setzt Zähler zurück; mehrere Prozesse teilen keine Limits. Keine zusätzliche Bibliothek oder Infrastruktur.
- API-Plan und Backend-Unterlagen berichtigt: Übersicht und Detail im Frontend senden inzwischen Token, berücksichtigen Kontowechsel und übernehmen den Autor. Dies wurde im vorhandenen Code gelesen, nicht als neue Frontend-Arbeit umgesetzt.

Abgrenzung Part 2: Object-URL-Freigabe, Laufzeitprüfung empfangener API-Antworten im Frontend, Dokumentensprache und Farbkontrast bleiben Frontend-Aufgaben. Backend-DTOs und Zod-Eingabeprüfung ersetzen diese Client-Prüfung nicht. Keine Barrierefreiheits-Abnahme behauptet.

Prüfung: Backend-Typprüfung und Build erfolgreich; 72 HTTP-/Middleware-Tests bestanden. Darin enthalten: bisherige Rechteprüfungen, persönliche Likes in Schreib-/Ordnerantworten, begrenzte DB-Abfragen, ungültige Query-Werte, Seitenende, Rate-Limits in der tatsächlichen App, Ablauf/Retry-After, Speichergrenze und kein Umgehen durch beliebige Forwarded-Header bei der aktuellen Express-Konfiguration. Externe Dienste sind dabei simuliert. Die neuen Funktionstests ersetzen keine authentifizierte Browser-/Clerk-/Cloudinary-Abnahme. Kontolöschung und dienstübergreifende Wiederholungslogik bleiben offen. Zusätzlicher echter Starttest nach der Bereinigung: Health 200, DB-Health 200/connected, Meme-Liste 200 mit 32 Memes und CORS für localhost:5173. Ausschließlich Leseabfragen; separaten Testserver anschließend beendet.


## Vorherige Priorisierung vom 13.11.2026

Erneuter lokaler Codeabgleich auf Branch `Backend`, Ausgangscommit `7e32961`; Arbeitsverzeichnis vor dieser Dokumentationspflege sauber. Die Backend-Aufteilung ist im vorliegenden Commit enthalten. Kein Remote-Abgleich und keine neue Funktionsabnahme in diesem Dokumentationsauftrag.

**Nächste größte offene Pflichtfunktion: vollständige Kontolöschung.** Der Nutzer-Router enthält derzeit nur `GET /api/me` und `POST /api/me/sync`; der Nutzer-Service synchronisiert Profile. Eine Kontolöschroute, ein koordinierter Löschservice und eine Anbindung für extern ausgelöste Clerk-Kontolöschungen sind im geprüften Anwendungscode nicht vorhanden. Das Prisma-Schema enthält Löschkaskaden; sie ersetzen weder Cloudinary-Bereinigung noch Clerk-Kontolöschung.

Empfohlene Reihenfolge:

1. **Kurze Prüfung nach der Umstrukturierung:** angemeldete Schreibaktionen mit eigenen separaten Testinhalten durchführen. Die letzte Prüfung umfasst 59 automatisierte HTTP-Tests mit simulierten Diensten, 99 Vorher-nachher-Vergleiche und echte Leseabfragen; sie ersetzt diese angemeldete Abnahme nicht.
2. **Kontolöschung konkret planen und vor Umsetzung vorlegen:** Bestätigung und Identität, betroffene lokale Daten, Bildkennungen, Clerk-Konto, Sperre während der Löschung sowie Verhalten bei Dienstfehlern und erneutem Versuch. Die Planung ist noch keine Freigabe für Code, neue Datenfelder oder echte Löschungen.
3. **Nach Freigabe schrittweise bauen und testen:** im bestehenden Nutzer-Modul bleiben, fachlichen Ablauf und HTTP-Verarbeitung trennen. Testfälle zuerst mit simulierten Diensten; echte Abnahme ausschließlich mit einem entbehrlichen Testkonto und eigenen Bildern. Fremde Memes und fremde Ordner müssen erhalten bleiben; Verweise auf gelöschte eigene Memes müssen entfernt werden.
4. **Danach:** Pagination, Missbrauchsbegrenzung und vollständige Integration/Abnahme. Bekannte Teilausfälle bei bestehenden Inhaltslöschungen bleiben ein eigener offener Punkt.

Ordner umbenennen/löschen und ADMIN-Löschrechte werden nicht erneut als fehlende Implementierung eingeplant. Die Dokumentation von API, Datenmodell und Spezifikation wurde entsprechend berichtigt. Keine neue Prozent- oder Terminschätzung ohne vollständige Neubewertung. Der unten stehende Bericht zur Aufteilung hält die damaligen Prüfergebnisse fest; historische Tagesstände bleiben gekennzeichnet.

## Prüfbericht vom 13.11.2026 – Backend-Aufteilung

Auf Josephines ausdrückliche Freigabe wurde die bisherige Serverdatei auf Branch `Backend` in Module für Memes einschließlich Likes, Kommentare, Ordner, Nutzer und Health aufgeteilt. Routen, HTTP-Controller und fachliche Services haben getrennte Zuständigkeiten. `src/app.ts` verbindet sie; `src/server.ts` enthält nur noch Dienstanbindung, Portprüfung und Serverstart. Validatoren und Dienstanbindungen bleiben gemeinsam nutzbar. Beschreibung: [Backend-Architektur](architektur.md).

Der Ausgangsstand dieser Aufteilung war Commit `b59a848`. Ordner umbenennen/löschen und die ADMIN-Ausnahme beim Löschen fremder Memes/Kommentare waren bereits vorhanden und sind keine neuen Funktionen dieser Änderung. Fremde Inhalte bearbeiten und fremde private Ordner verwalten bleibt verboten. Prisma-Schema, Migrationen, Pakete, Frontend und öffentliche API-Verträge wurden nicht geändert.

| Prüfung dieser Aufteilung | Ergebnis |
| --- | --- |
| `npm run typecheck` / `npm run build` | Erfolgreich |
| `npm test` | 59 erfolgreiche HTTP-Regressionstests mit tatsächlicher Express-App und simulierten externen Diensten |
| Alter Monolith gegen aufgeteilte App | 99 Vergleichsfälle: gleiche HTTP-Antworten und gleiche Argumente/Reihenfolge externer Dienstaufrufe |
| Routenabgleich | Alle 22 Kombinationen aus Methode und Pfad erhalten |
| Zuständigkeitsprüfung | Services ohne Express-Zugriff; Fachcontroller ohne direkte Daten-/Bildspeicherzugriffe; `app.ts` öffnet keinen Port |
| Start des gebauten Servers mit bestehender lokaler Konfiguration | Erfolgreich auf freiem Testport; anschließend beendet |
| Echte lokale Leseabfragen | Health 200, DB-Health 200/connected, Meme-Liste 200 mit 32 Memes; CORS für localhost:5173 vorhanden |

Die bisherigen 21 Moderationstests sind Bestandteil der 59 Tests und prüfen jetzt über HTTP statt über das Auslesen von Handler-Quelltext. Die Testdienste verändern keine echten Nutzer, Bilder oder Datenbankeinträge. Der anschließende reale Starttest führte ausschließlich Leseabfragen aus. Eine erneute Live-Abnahme angemeldeter Schreibaktionen, externer Ausfälle oder der Frontend-Oberfläche ist damit nicht behauptet.

Keine neuen Funktionen, Migrationen oder Abhängigkeiten. Keine Commits, Pushes oder Merges durch diesen Refactoring-Auftrag. Bekannte funktionale Grenzen bestehen weiter, insbesondere Kontolöschung, dienstübergreifende Teilausfälle und fehlendes `likedByMe` in Ordner-Memes. Eine neue Fortschritts-Prozentzahl wurde für diesen Architekturauftrag nicht ermittelt.

**Die folgenden Einträge sind historische Momentaufnahmen.** Aussagen zu fehlenden Funktionen, Live-Abnahmen, Tests und Prozentwerten gelten jeweils für den dort beschriebenen Prüfzeitpunkt und dürfen nicht als aktueller Gesamtstand gelesen werden.

## Früherer Nachtrag vom 13.11.2026 – Administrator-Löschrechte

Auf ausdrücklichen Auftrag wurden ausschließlich die beiden vorhandenen Löschrouten für Memes und Kommentare um die ADMIN-Ausnahme erweitert. Die Rolle wird über die verifizierte Clerk-ID aus dem lokalen User-Datensatz gelesen; Angaben zu Rolle oder Benutzer-ID im Request-Body verleihen keine Rechte. Besitzer dürfen weiterhin eigene Inhalte löschen. Fremde Inhalte bearbeiten und fremde private Ordner lesen/ändern/löschen bleibt auch für Administratoren verboten. Neue Benutzer erhalten weiterhin USER. Keine Migration, neue Bibliothek, öffentliche Rollenvergabe oder Änderung einer echten Kontorolle.

Prüfung: Backend-Typprüfung und Build erfolgreich. `node --test --test-isolation=none tests/moderation.test.mjs` führt 21 erfolgreiche isolierte Tests der tatsächlichen Route-Handler aus. Clerk, Prisma und Cloudinary sind Testdoubles; keine echten Konten, Bilder oder Datenbankeinträge wurden verändert. Enthalten sind anonyme Zugriffe, Besitzer, normale fremde Benutzer, ADMIN-Löschung, gefälschte Rolle im Body, fehlendes Profil, DB-Rollenfehler, fehlende Inhalte, Cloudinary-Fehler/Wiederholung sowie das weiterhin geltende Bearbeitungs- und Ordnerverbot. Diese Tests ersetzen keine HTTP-/Clerk-/Datenbank-/Cloudinary-Integration. Ein Live-Administratortest und sichere kontrollierte Rollenvergabe sind noch offen.

Änderungen lokal, ohne Commit/Push/Merge. Die folgenden Angaben und Prozentwerte dokumentieren den älteren Stand vom 12.11.; die dort noch als fehlend genannte Admin-Löschlogik ist durch diesen Nachtrag überholt, ihre Live-Abnahme bleibt offen.

Stand: 12.11.2026, nach Ordner-Anlage, Listen-/Detailabfrage und Meme-Zuordnungen. Lokaler Backend-Branch und GitHub-main beim Abgleich: `1ff7cba`; veröffentlichter Frontend-Branch: `01bc9bc` (bereits in gemeinsamem Stand enthalten). Arbeitsverzeichnis vor dieser Dokumentationspflege sauber. Nicht veröffentlichte Änderungen auf anderen Rechnern sind nicht bewertet. Abgabe 23.11.2026; Deployment freiwillig.

## Was tatsächlich vorhanden ist

- Express/TypeScript, PostgreSQL/Prisma mit sechs Modellen und angewendeter Initialmigration.
- Öffentliche Meme-Liste, Meme-Detail und Kommentarabfrage; Ersteller und Interaktionszähler.
- Clerk-Identitätsprüfung, lokale Nutzer-Synchronisation; eigener PNG-Upload bis 5 MiB über Cloudinary nach PostgreSQL.
- Eigene Meme-Titel ändern und eigene Memes einschließlich Cloudinary-Bild löschen; eigene Kommentare erstellen/bearbeiten/löschen; eigene Likes setzen/entfernen ohne Duplikate.
- GET /api/memes und GET /api/memes/:id liefern jetzt `likedByMe`; ohne erkannte Anmeldung false, mit Anmeldung eigener gespeicherter Status.
- Zentrale Fehlerbehandlung für kaputtes JSON (400), zu große JSON-Anfragen (413) und unerwartete Fehler (500), jeweils ohne interne Details im Antworttext.
- Ordner erstellen, ausschließlich eigene Ordner auflisten, eigenen Ordner mit Memes laden, Memes hinzufügen und Zuordnungen entfernen. Besitz wird vor Antwort beziehungsweise Mutation geprüft; wiederholtes Hinzufügen erzeugt keinen doppelten Eintrag.
- Frontend: echte Übersicht/Detail/Kommentar-Liste, Clerk-Oberfläche, PNG-Upload mit abgewartetem Benutzer-Sync, Kommentarformular und API-Like-/Unlike-Aktionen in Liste und Detail vorhanden. Lokale Zusatz-Zählung der Likes wurde entfernt.
- 29 gemeinsame Bild-Fixtures samt Importskript; echte Nutzer, Kommentare, Likes und Ordner werden nicht über Git kopiert.

## Aktuell geprüft und Grenzen

| Prüfung am 12.11.2026 | Ergebnis |
| --- | --- |
| Backend npm run typecheck und npm run build | Erfolgreich |
| npx prisma validate | Erfolgreich |
| Frontend npm run lint und npm run build | Erfolgreich |
| GET health / health/db | 200 / connected |
| CORS und OPTIONS von localhost:5173 | Passender Allow-Origin; Preflight 204 |
| Kaputtes JSON / JSON über Parser-Limit | 400 / 413 als JSON, keine internen Details |
| Meme-Liste ohne Token | 200, 32 Memes, likedByMe überall false |
| Meme-Liste/Detail mit bestehender Clerk-Sitzung | 200, Test-Meme korrekt likedByMe true, likeCount 1 |
| Fünf Ordner-Endpunkte ohne Anmeldung | Jeweils 401 |
| Eigene Ordner / eigene Ordner-Detailabfrage | 200; ein Ordner, Inhalt leer |
| Leerer Ordnername / ungültige Ordner-ID | 400 / 400 |
| Nicht vorhandener Ordner / nicht vorhandenes Meme beim Hinzufügen | 404 / 404 |
| Ungültiger memeId-Body beim Hinzufügen | 400 |
| Migration laut DB-Abfrage | 20261104125318_init abgeschlossen, nicht zurückgerollt |
| Datenbestand als Momentaufnahme | 32 Memes, 1 Kommentar, 1 Like, 1 Ordner, 0 FolderMeme-Zuordnungen |

In diesem Dokumentationsabgleich nur Leseabfragen und abzuweisende Anfragen; keine erfolgreichen Inhaltsänderungen und keine Löschungen.

**Durch Josephine heute bestätigt:** Ordner erstellen/laden, Meme hinzufügen, denselben Ablauf mit frischem Token wiederholen (nur ein Eintrag), Zuordnung entfernen und anschließend das ursprüngliche Meme weiterhin per GET abrufen. Liste und Detail wurden nach Token-Erneuerung mit persönlichem Like-Status geprüft. Browser-Upload bis Cloudinary bereits bestätigt. Eine vollständige neue Browser-Abnahme von Kommentaren und Likes wurde nicht behauptet.

**Früher selbst geprüft:** separates Upload-Test-Meme erfolgreich gelöscht (DELETE 204, GET danach 404, PostgreSQL-Eintrag und Cloudinary-Ressource entfernt). Das war kein befüllter Kaskadentest. Frühere manuelle Meme-/Kommentar-/Like-Schreibtests wurden von Josephine bestätigt.

**Noch nicht geprüft:** fremder Ordner mit zweitem Benutzer (kein fremder Fixture-Ordner vorhanden), vollständige zwei-Konten-Kommentarrechte, befüllte Löschkaskaden, Cloudinary-/DB-Ausfälle, Parallelzugriffe, vollständiger Browser-Neulade-/Anmeldewechseltest. Keine versionierte automatisierte Backend-Testsuite.

## Kritische Befunde

1. **Frontend-GETs ohne Bearer-Token:** fetchMemes/fetchMemeById senden keinen Token; Effekte laden nicht bei Anmeldewechsel neu. Der persönliche Herz-Zustand kann nach Neuladen oder Kontowechsel falsch sein. Backend-Vertrag ist jetzt vorhanden, Dileks Anbindung noch vervollständigen.
2. **Ordner noch unvollständig:** Umbenennen und Löschen eigener Ordner fehlen. Frontend-Ordnerseite ist Platzhalter, Erstellen/Speichern/Entfernen noch nicht angebunden. Zwei-Konten-Test der Besitzerprüfungen fehlt.
3. **Inkonsistente persönliche Meme-Felder:** Nur öffentliche GET-Liste/-Detail ergänzen likedByMe. Meme-POST/PATCH und Memes innerhalb GET /api/folders/:id verwenden formatMeme ohne dieses Feld. Bei künftiger Ordner-Like-Oberfläche Vertrag berücksichtigen.
4. **Weitere Frontend-Restarbeit:** Meme-Autor wird weiterhin durch Community ersetzt; eigene Meme-Titel-/Löschoberfläche und Kommentar-Bearbeiten/-Löschen fehlen. Sichtbarer Upload-Link fehlt in der Navigation; /upload ist direkt aufrufbar.
5. **Sync:** Upload wartet jetzt erfolgreich auf syncCurrentUser; der frühere Upload-/409-Rennfall ist im Code behoben. Layout unterdrückt Sync-Fehler weiterhin; Kommentar-/Like-Aktionen warten nicht ausdrücklich darauf. Bei Erstlogin ohne vorherigen Upload getrennt prüfen. Die Sync-Antwort mit lokaler ID wird im Client noch nicht übernommen.
6. **Frontend-Robustheit:** Listen-Like-Buttons haben keine Anfrage-Sperre, Detail-Like-Button schon. Nach Kommentar-POST wird lokal angehängt; paralleles anfängliches Laden oder zuvor fehlgeschlagene Kommentarabfrage kann die angezeigte Liste/Anzahl unvollständig machen. Kommentar-Text bleibt bei Fehlern erhalten. Vorschau-Object-URLs werden noch nicht freigegeben.
7. **Dienstübergreifende Löschung:** Cloudinary zuerst, dann DB. Bei anschließendem DB-Fehler kann ein Eintrag ohne Bild bleiben. Wiederholung akzeptiert fehlendes Bild; keine dauerhafte Wiederholungslogik. Upload-DB-Fehler lösen Bild-Bereinigungsversuch aus; fehlgeschlagene Bereinigung wird nur geloggt.
8. **Fehlende Pflichtfunktionen:** Administrator-Moderation und vollständige bestätigte Kontolöschung über PostgreSQL, Clerk und Cloudinary. Rolle ADMIN/DB-Kaskaden allein reichen nicht. Eventuelle direkte Clerk-Kontolöschung benötigt ebenfalls Bereinigungsanbindung.
9. **Qualität:** Keine Pagination/Listenbegrenzung und kein Rate-Limit. Lesen-vor-Schreiben-Rennen können generische 500 erzeugen. Ordner-Detail lädt Inhalte intern vor Besitzerprüfung, gibt sie aber erst nach erfolgreicher Prüfung aus. Vollständige Grenzfall-/Rechte-/Ausfalltests fehlen.
10. **Kleine Aufräumpunkte:** Upload-Meldung sagt JPNG; Validator enthält ausführbaren Beispieltest; Paket nennt >=22.9.0 trotz höherer Prisma-Anforderung im 22er-Zweig. Node 24 verwenden. PNG-Signaturerkennung ist keine vollständige Bilddekodierung. Keine Anwendungscodeänderung in dieser Dokumentationspflege.

Dileks Arbeitsprotokoll meldet fehlende lokale Cloudinary-Variablen als Hindernis für ihren Browser-Test. Das ist eine Aussage zu ihrem Rechner; Josis Backend wurde heute erfolgreich geprüft. Zugangsdaten lokal und über geeigneten privaten Weg abstimmen, nicht im Repository oder Frontend hinterlegen. Nicht ohne Rückmeldung behaupten, ihr Startproblem sei bereits gelöst.

## Gewichtete Fortschrittsschätzung

Gleiche Bewertungsbereiche wie am 11.11.; vollständiger vereinbarter Umfang einschließlich Tests, Integration und Abnahme. Kategorien, Suche, Editor und optionales Deployment zählen nicht als fehlende Pflichtfunktionen. Ungefähr ±5 Prozentpunkte Unsicherheit.

| Backend-Bereich | Gewicht | Erreicht |
| --- | ---: | ---: |
| Grundlage, Datenmodell, Datenbank, Lese-API | 20 | 20 |
| Identität und lokale Nutzer | 10 | 9 |
| Meme-Upload/-Bearbeitung/-Löschung | 15 | 14 |
| Kommentare | 10 | 9 |
| Likes einschließlich persönlichem Status | 10 | 9 |
| Persönliche Ordner | 10 | 6 |
| Moderation | 5 | 0 |
| Kontolöschung | 10 | 0 |
| Absicherung, Tests, Dokumentation | 10 | 8 |
| **Backend** | **100** | **75** |

| Frontend-Bereich | Gewicht | Erreicht |
| --- | ---: | ---: |
| Layout und Navigation | 15 | 15 |
| Clerk und Nutzeranbindung | 10 | 10 |
| API-Übersicht und Detail | 15 | 14 |
| Upload und Meme-Verwaltung | 15 | 9 |
| Kommentare anzeigen und verwalten | 10 | 6 |
| Dauerhafte Likes | 10 | 6 |
| Persönliche Ordner | 10 | 1 |
| Moderation | 5 | 0 |
| Kontolöschung | 5 | 0 |
| Integration, Zugänglichkeit und Abnahme | 5 | 2 |
| **Frontend** | **100** | **63** |

Gerundet auf fünf Prozentpunkte: **Backend ca. 75 %, Frontend ca. 65 %, insgesamt ca. 70 %.** Gesamt ist der Mittelwert beider Bereiche bei gleicher Gewichtung (rechnerisch 69 %, gerundet 70 %). Das ist eine Aufwandsschätzung, keine objektive Messung oder Terminzusage. Noch kein Bereich ist abgenommen.

## Nächste Schritte und Zeitlage

- **Josephine zuerst:** Ordner umbenennen/löschen und dann Besitzerrechte mit zwei Konten prüfen. Danach Admin-Löschrechte, vollständige Kontolöschung und verbleibende Absicherung.
- **Dilek parallel:** Token bei Listen-/Detail-GET und erneutes Laden bei Kontowechsel, Autor aus API, Erstlogin-/Mehrfachklickfälle testen. Bereits vorhandenes Kommentarformular und Like-Aktionen nicht neu bauen. Danach eigene Meme-/Kommentarverwaltung und Ordner-UI.
- **Gemeinsam:** Dileks lokale Cloudinary-Konfiguration klären; Upload/Kommentar/Like einschließlich Neuladen und Fehlermeldungen browserseitig testen. Befüllte Löschkaskaden und Teilausfälle folgen vor Abnahme.

12.–19.11. einschließlich sind sechs Werktage. Kernumfang bis 18./19.11. bleibt anspruchsvoll: insbesondere Kontolöschung, Moderation und gemeinsame Abnahme sind offen. 19.–20.11. möglichst für Fehlerbehebung, Demo und Unterlagen freihalten; Abgabe 23.11. Am 13.11. anhand fertig getesteter Abläufe neu priorisieren. Mittagspause 12–13 Uhr. Zwischenbesprechung gegen 11:45 Uhr war vorgeschlagen, keine verbindliche Kalenderbuchung.

## Zusammenarbeit und Dokumentation

[API](api-plan.md) · [Backend starten](../README.md) · [Datenmodell](datenmodell.md) · [Trello](https://trello.com/b/EpjAfv15/your-meme) · [Historischer Zwischenbericht 11.11.](zwischenbericht-2026-11-11.md) · [Zwischenbericht 12.11.](zwischenbericht-2026-11-12.md)

Anwendungscode bleibt zum Selbsttippen. Dokumentationsänderungen aus diesem Auftrag sind lokal, ohne Commit/Push/Merge. Arbeitsprotokolle und historische Tagespläne bleiben zeitlich gekennzeichnet. Nur belegte Einzelschritte abhaken; gemeinsame Sammelkarten bleiben offen, solange Integration oder Abnahme fehlt. Trello im aktuellen Abgleich: 19 aktuelle Beschreibungen erneuert, neun belegte Checklistenschritte abgehakt, Ordnerkarte nach In Bearbeitung verschoben, neuer Zwischenbericht für 12.11. erstellt und Bericht 11.11. als historisch markiert. Beschreibungen und betroffene Checklisten anschließend erneut gelesen.

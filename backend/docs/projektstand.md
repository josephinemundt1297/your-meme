# Your Meme – Projektstand und Arbeitsweise

## Aktuelle Priorisierung vom 13.11.2026

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

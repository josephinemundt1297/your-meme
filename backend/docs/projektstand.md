# Your Meme – Projektstand und Arbeitsweise

Stand: 11.11.2026, Zwischenstand vor der Mittagspause. Code: Backend 1709a2d, einschließlich gemeinsamer Bild-Testdaten. Der zu Beginn gelesene GitHub-main enthielt denselben Dateistand; lokale main-Referenzen können zurückliegen. Vor dieser Dokumentationsänderung war Backend sauber. Abgabe 23.11.2026, Präsentationstermin offen, Deployment freiwillig.

## Bestätigter Stand

- Express/TypeScript und PostgreSQL/Prisma mit sechs Modellen, erster Migration und Prisma-Client vorhanden. Öffentliche Meme-, Detail- und Kommentarabfragen implementiert; Ersteller und Zähler werden geliefert.
- Clerk-Middleware, GET /api/me und POST /api/me/sync mit upsert anhand der eindeutigen Clerk-ID vorhanden. Josephine hat erfolgreiche angemeldete Tests und gleichbleibende lokale UUID bei Wiederholung bestätigt.
- CORS erlaubt localhost:5173. Frontend-Übersicht lädt API-Daten; Josephine bestätigt sichtbare Bilder/Titel und inzwischen den funktionierenden Stand bei Dilek.
- 29 Bild-Testdatensätze und Importskript liegen jetzt unter prisma/. Import ordnet neue Einträge einem Demo-Profil zu und überspringt vorhandene IDs. Keine Kopie echter Clerk-Konten oder Interaktionen; gemeinsam verwendete Cloudinary-Bildadressen.
- Multer und file-type installiert. POST /api/memes prüft Anmeldung vor Dateiannahme, Titel (getrimmt 1–100 Zeichen), genau eine PNG-Datei bis 5 × 1024 × 1024 Bytes und deren Dateisignatur. Die JPG-Idee wurde durch PNG ersetzt. Josephine bestätigt den erfolgreichen PNG-Postman-Test: HTTP 200 und Upload-Prüfung erfolgreich. Noch nichts gespeichert.
- Cloudinary-Konfiguration und erfolgreicher Ping bereits bestätigt. src/lib/uploadImage.ts implementiert einen PNG-Upload-Stream und liefert imageUrl/imageStorageId. Diese Funktion ist noch nicht in die Route eingebunden und in diesem Schritt nicht als realer Upload getestet.

## Prüfungen und Grenzen am 11.11.2026

| Prüfung | Ergebnis / Grenze |
| --- | --- |
| Backend-TypeScript | npm run typecheck erfolgreich |
| Prisma-Schema | prisma validate erfolgreich; keine erneute Migrationsstatusabfrage |
| Frontend | App-TypeScript und npm run lint erfolgreich; kein neuer vollständiger Build |
| Live-GETs health, health/db, memes | 200; DB connected; 29 Memes |
| CORS | Passender Allow-Origin-Header für localhost:5173 |
| GET /api/me ohne Anmeldung | 401 |
| Erfolgreiche Anmeldung und Nutzer-Sync | Zuvor durch Josephine bestätigt; beim heutigen Dokumentationsabgleich nicht erneut authentifiziert |
| PNG-Upload-Prüfung | Josephine bestätigt Erfolg; vorherige Mehrfachauswahl, falsches Format und fehlende Anmeldung abgewiesen |
| Vollständiger Upload / DB-Anlage / Bereinigung | Noch nicht implementiert oder getestet |

5-MiB-Limit und Titelgrenzen sind im Code enthalten; vollständige Grenzfalltests fehlen. Signaturerkennung ist keine vollständige Bilddekodierung. Kein neuer Live-Upload, keine Löschung und keine DB-Schreibprüfung im Dokumentationsabgleich. Die früher geprüften Bildadressen wurden dabei nicht alle erneut einzeln abgerufen.

## Noch offen

- Lokalen Ersteller vor Cloudinary-Upload ermitteln; uploadImage aus der Route aufrufen; Meme speichern; bei DB-Fehler das neu hochgeladene Bild bereinigen. Aktuelle 200-Antwort ist keine Anlagebestätigung.
- Eine generische 400-Upload-Meldung sagt noch JPG/JPEG statt PNG. Anwendungscode im Rahmen dieser Dokumentationspflege unverändert.
- DELETE /api/memes/:id bleibt 503-Platzhalter; PATCH und Inhalts-Eigentümer-/Adminrechte fehlen.
- Likes, Kommentaränderungen, persönliche Ordner, Moderation und Kontolöschung über PostgreSQL/Clerk/Cloudinary.
- Frontend-Detailseite nutzt sampleMemes; Kommentare sind Platzhalter. API-Client ersetzt author noch durch Community. Nutzer-Sync/Token und echter Formular-Upload noch nicht automatisch verbunden; Dateiauswahl erlaubt im Code noch weitere Formate und muss zur PNG-Regel passen.
- Pagination, zentrale Fehlerbehandlung, Missbrauchsbegrenzung und vollständige Tests. Jest/Supertest und automatisiertes Testskript fehlen.
- Beispieltestcode in validators/meme.ts, ungenaue Node-Mindestversion, fehlende Cloudinary-Platzhalter in .env.example und verbleibende API-Verträge/Dokumentation.
- Bildaustausch beim Bearbeiten, Alt-Text-Erweiterung und dienstübergreifende Löschabläufe noch nicht abschließend umgesetzt.

## Restplan für heute und Zeitlage

Zuerst lokalen Ersteller, Cloudinary und PostgreSQL zu einem vollständigen Upload verbinden. Danach Erfolgs-/Fehlerfälle prüfen; Frontend-Formular nur bei rechtzeitig fertiger API gemeinsam anbinden. Parallel Detailseite und author im Frontend fertigstellen. Vor 12 Uhr kurze Abstimmung, Mittagspause 12–13 Uhr; Nachmittag Umsetzung, Tests und Tagesabschluss. Die Abwesenheit am 10.11. war ein gestriger Termin, keine heutige Sperrzeit.

Bis 19.11. einschließlich heute sieben Werktage. Ziel Kernfunktionen bis 18.11. und Tests/Vorbereitung 19.–20.11. bleibt zeitlich gefährdet; Abgabe 23.11. Am 13.11. anhand tatsächlich fertiger Abläufe gemeinsam neu priorisieren. Keine neue Termin- oder Umfangszusage. Frühere Prozentwerte sind Aufwandsschätzungen vom 10.11., keine aktuelle Messung.

[Zwischenbericht für Dilek](zwischenbericht-2026-11-11.md) · [API](api-plan.md) · [Backend-Start](../README.md)

## Trello und Zusammenarbeit

[Trello-Board](https://trello.com/b/EpjAfv15/your-meme). Am 11.11. wurden elf bestehende Beschreibungen aktualisiert, zwei belegte Einzelschritte abgehakt und eine Übersichtskarte zum Zwischenbericht/Restplan erstellt. Beschreibungen und Checklisten wurden anschließend erneut gelesen. Sammelkarten bleiben offen, wenn Integration oder Abnahme fehlt. Historische Tagespläne bleiben als solche erhalten; Checklistenpunkte nur im belegten Umfang abhaken.

Josephine arbeitet auf Backend, Dilek auf Frontend; ein Branch umfasst das gesamte Repository. Keine Push-Sperren umgehen. Gemeinsamen Stand über geprüfte Pull Requests zusammenführen. Lokale Datenbankinhalte werden nicht automatisch geteilt, Testdaten werden gezielt mit dem Importskript eingerichtet. Keine Schlüssel in Dokumentation/Git. Anwendungscode schreibt Josephine selbst.

## Historischer Stand vom 04.11.2026

Die folgenden ursprünglichen Aussagen dokumentieren den damaligen Stand und dürfen nicht als heutige offene Aufgaben oder aktuelle Branch-/Installationsangaben gelesen werden.

Stand: 04.11.2026. Backend-Dateien und Dokumentation abgeglichen; frühere Planungs- und Board-Angaben sind unten als historisch gekennzeichnet.
Abgabe: 23.11.2026. Präsentationstermin noch offen.

## Tatsächlich erledigt

- **Planungsentwurf gespeichert:** Datenmodell mit sechs Modellen, Beziehungen, Berechtigungen und Kontolöschung; Backend-Anforderungen und Backend-Regeln liegen als Dateien vor.
- **Ordnerstruktur angelegt:** Das bestehende Vite-Projekt liegt unter `frontend/`; Backend-Planung unter `backend/`; die gemeinsame README verweist auf diese Bereiche.
- **Backend-Grundgerüst vorhanden:** Express und TypeScript eingerichtet. Statusroute `GET /api/health`, JSON-Antwort für unbekannte Routen und optionale Port-Einstellung vorhanden. Details: [Backend-Startanleitung](../README.md).
- **Prisma vorbereitet:** Prisma 7.10.1, PostgreSQL-Adapter und `pg` installiert. `prisma7.config.ts` wird von der installierten CLI erkannt. Schema mit sechs Modellen, erste Migration `20261104125318_init` und Client-Modul `src/lib/prisma.ts` vorhanden. Der generierte Client liegt lokal unter `src/generated/prisma/` und ist aus Git ausgeschlossen.
- **Datenmodell abgeglichen:** Modelle, Felder, Schlüssel, Beziehungen und Löschkaskaden stimmen zwischen Dokumentation, Schema und erster Migrationsdatei überein. Passwörter sind nicht im Schema enthalten; neue Nutzer haben standardmäßig die Rolle `USER`.
- **Dokumentation aktualisiert:** Startanleitung um Datenbankkonfiguration und Client-Generierung ergänzt, `.env.example` um einen PostgreSQL-Platzhalter erweitert, geplante API und implementierte Statusroute getrennt. Das Hand-out vom 30.10. ist als historischer Tagesplan gekennzeichnet.
- Diese Ergebnisse belegen noch keine vollständige Anwendung. `src/server.ts` importiert das Client-Modul nicht und führt keine Datenbankabfragen aus.
- Das gemeinsame Durchsprechen und die fachliche Prüfung des Entwurfs bleiben eine eigene offene Aufgabe.
- Die Abstimmung der Ordnerstruktur und der Frontend-Anbindung mit Dilek ist durch diese Backend-Prüfung nicht nachgewiesen.

## Prüfungen und Grenzen am 04.11.2026

- Node.js 24.14.0 und npm 11.9.0 lokal vorhanden.
- TypeScript-Typprüfung, TypeScript-Build und Prisma-Schema-Validierung erfolgreich. Der Build wurde für diese Prüfung außerhalb des Backend-Ordners erzeugt.
- `.env`, `node_modules/`, `dist/` und der generierte Prisma-Client sind durch die vorhandenen Git-Regeln ausgeschlossen. `.env.example` enthält nur Beispielwerte.
- Skill-Verzeichnis, Lockdatei und vorhandene Werkzeug-Verknüpfungen sind konsistent; sie gehören nicht zur laufenden API.
- Keine Live-Datenbankabfrage, kein Abgleich angewendeter Migrationen und kein aktueller HTTP-Funktionstest im Rahmen dieser Dokumentationsprüfung. Das Trello-Board und das Frontend wurden nicht geprüft oder geändert.
- Historisch dokumentierte Starttests vom 02.11. sind keine erneuten Funktionstests am 04.11.

## Noch offen

- Datenbeziehungen sicher erklären, insbesondere Ersteller, Ordnerbesitzer und FolderMeme.
- Seitenstruktur und vorläufige Router-Wahl mit Dilek abstimmen.
- API-Datenformate vollständig festlegen. `api-plan.md` dokumentiert die vorhandene Statusroute und fünf noch geplante Meme-Endpunkte.
- Datenbankverbindung und angewendeten Migrationsstand prüfen; danach erste Abfragen und Endpunkte mit dem vorhandenen Prisma-Client verbinden.
- Clerk-Anbindung, lokale Nutzeranlage und Bildspeicher umsetzen.
- Kernfunktionen umsetzen und Frontend und Backend verbinden.
- Laufzeitvalidierung, JSON-Body-Verarbeitung, Berechtigungsprüfungen, passende CORS-Einstellungen und zentrale Fehlerbehandlung mit den fachlichen Endpunkten ergänzen. Diese fehlen derzeit; der vorhandene öffentliche Statusendpunkt benötigt noch keine Anmeldung.
- Automatisierte Tests und ein Testskript nach Bedarf einrichten; Zod, Jest und Supertest sind nicht installiert. Postman ist kein npm-Paket und wurde nicht auf Verfügbarkeit geprüft.
- **Node-Versionsangabe korrigieren:** `package.json` und der Wurzeintrag von `package-lock.json` erlauben noch `>=22.9.0`. Die installierten Prisma-Pakete verlangen laut ihren lokalen Paketmetadaten `^20.19 || ^22.12 || >=24.0`. Damit ist beispielsweise Node.js 22.9 erlaubt, obwohl Prisma es nicht unterstützt. Die Anleitung verwendet Node.js 24; die Paketkonfiguration wurde bei dieser Dokumentationsprüfung nicht geändert.
- Dienstübergreifende Kontolöschung konkretisieren. Die Löschkaskaden decken nur Datenbankbeziehungen ab; für Bildspeicher, Clerk und Wiederholungen bei Teilausfällen fehlt die Anwendungslogik.
- Startanleitung bei neuen Funktionen fortführen und Präsentation erstellen.

## Welche Schwierigkeiten entstehen könnten

### Weniger verfügbare Zeit durch Termine

Die folgende Terminplanung stammt vom 30.10.2026. Der 03.11. liegt inzwischen in der Vergangenheit;
aus den eingetragenen Terminen verbleiben ab 04.11. bis zur Abgabe 4 Std. 30 Min. Abwesenheit (05.11. und 10.11.).
Ob die damalige Tagesplanung eingehalten wurde, ist hier nicht geprüft.

- Josephines regulärer Zeitrahmen: Montag bis Freitag, 09:00–16:00 Uhr einschließlich Pausen. Am Wochenende wird in der Regel nicht gearbeitet.
- Die folgenden Zeiten sind bestätigte Abwesenheiten und stehen nicht für Projektarbeit zur Verfügung. Sie betreffen Josephine; Dileks Verfügbarkeit ist damit nicht festgelegt.

| Datum | Nicht verfügbar | Ausfall innerhalb von 09:00–16:00 Uhr |
| --- | --- | --- |
| 03.11.2026 | 09:00–11:45 Uhr und 13:30–16:00 Uhr | 5 Std. 15 Min. |
| 05.11.2026 | 13:00–16:00 Uhr | 3 Std. |
| 10.11.2026 | 13:00–14:30 Uhr | 1 Std. 30 Min. |
| **Bis zur Abgabe insgesamt** | | **9 Std. 45 Min.** |
| 24.11.2026 | 09:30–10:30 Uhr | 1 Std.; liegt nach der Abgabe am 23.11. und zählt nicht zur obigen Summe. |

- **Mögliche Schwierigkeit:** Für Backend-Arbeit und gemeinsame Abstimmungen bleibt an diesen Tagen weniger Zeit. Offene Fragen können dadurch die jeweils andere Person aufhalten.
- **Umgang damit:** Gemeinsame Absprachen außerhalb der Abwesenheiten legen und den verkürzten Tagen entsprechend kleine Aufgaben zuordnen. Pausen und Zeit für mögliche Probleme zusätzlich berücksichtigen; die übrigen Stunden sind nicht vollständig als konzentrierte Arbeitszeit verfügbar.
- **Planungsempfehlung für Puffer:** Nur etwa 70–75 Prozent der tatsächlich verfügbaren Arbeitszeit mit Aufgaben belegen. Der Rest bleibt für Rückfragen, technische Probleme und Nacharbeiten frei. Wochenenden nicht als feste Ausweichzeit einplanen.
- **Vorgeschlagener Zieltermin:** Kernfunktionen möglichst bis 18.11. fertigstellen; 19.–20.11. für Fehlerbehebung und Abgabevorbereitung freihalten. Am 23.11. letzter Check und Abgabe. Das ist ein Planungsziel, keine Zusage, dass die Umsetzung bis dahin fertig ist.

## Vorhandene Branches

- `Backend`: Josephines Arbeitsbranch; bei der Prüfung aktiv.
- `Frontend`: Dileks Arbeitsbranch.
- `main`: gemeinsamer Hauptbranch.
- Alle drei Branches sind lokal vorhanden. Ein Branch umfasst den Entwicklungsstand des gesamten Repositorys und ist nicht mit dem gleichnamigen Arbeitsbereich zu verwechseln.
- Die Ordnerumstellung wurde im aktiven Backend-Arbeitsstand vorgenommen. Sie ist damit nicht automatisch in Dileks Branch oder in `main` übernommen. Das wird gemeinsam abgestimmt.

## Sinnvolle Reihenfolge

1. Datenmodell verstehen, Seiten skizzieren und benötigte Daten gemeinsam festlegen.
2. Mit dem vorhandenen Backend-Grundgerüst Datenbankverbindung und Migrationsstand prüfen; erste Prisma-Abfrage anbinden.
3. Öffentliche Meme-Liste und Detailseite mit Testdaten verbinden. Die Anmeldung kann parallel vorbereitet werden.
4. Clerk-Anmeldung und lokale Nutzerprofile verbinden, bevor geschützte Schreibfunktionen genutzt werden.
5. Bildspeicher auswählen; Upload, Bearbeiten und Löschen eigener Memes umsetzen.
6. Likes, Kommentare und persönliche Ordner ergänzen.
7. Administratorfunktionen und Kontolöschung vollständig verbinden.
8. Gemeinsame Abschlussprüfung, Demo und Abgabe vorbereiten.

**Während aller Schritte:** Eingaben prüfen, Rechte kontrollieren, passende Tests ergänzen, auf kleine Bildschirme und Tastaturbedienung achten und Dokumentation aktualisieren.
Begleitende Karten stehen deshalb im Board früh in der Liste; sie müssen nicht vollständig abgeschlossen sein, bevor die erste Funktion beginnt.

## Trello lesen

Die folgenden Board-Regeln und Farbangaben stammen aus der dokumentierten Planung vom 30.10.2026.
Sie wurden am 04.11. nicht mit dem Live-Board abgeglichen.

[Board öffnen](https://trello.com/b/EpjAfv15/your-meme).

- Die Liste zeigt den Arbeitsstand. Leere Prüfspalten sind für spätere Phasen vorgesehen.
- Die Position einer Karte zeigt die grobe Bearbeitungsreihenfolge. Dilek und Josephine können parallel arbeiten.
- Ein Etikett mit Farbe und Text zeigt die Zuständigkeit; die Beschreibung teilt bei gemeinsamen Karten Frontend- und Backend-Aufgaben auf.
- Die Checkboxen zeigen einzelne Arbeitsschritte. Abhaken erst nach tatsächlicher Erledigung.
- Übersichts- und Zeitplankarten sind Informationen; ihre Aufgaben werden auf den eigentlichen Aufgabenkarten erledigt, nicht doppelt gezählt.

| Farbe | Beschriftung | Bedeutung |
| --- | --- | --- |
| Blau | Backend · Josephine | Josephine übernimmt die Backend-Arbeit. |
| Lila | Frontend · Dilek | Dilek übernimmt die Frontend-Arbeit. |
| Rosa | Gemeinsam | Beide arbeiten an dieser Karte; Zuständigkeiten stehen im Text. |
| Gelb | P1 · Zuerst | Einer der nächsten Planungsschritte; keine zusätzliche Frist. |
| Himmelblau | Information | Übersicht oder Plan zum Nachschlagen. |
| Grün | Erledigt | Das ausdrücklich beschriebene Ergebnis liegt vor. |
| Rot | Blockiert | Ein konkretes Hindernis verhindert die Weiterarbeit; im Text erklären. |

Nicht allein auf Farben verlassen: Etikettennamen und Zuständigkeit stehen zusätzlich im Text.
Karten ohne P1 bleiben vereinbart; begleitende Qualitätssicherung beginnt mit der ersten passenden Funktion.
Die breiten farbigen Kartenköpfe aus der Vorlage kennzeichnen keine Person oder Priorität.

## Prüfung vom 30.10.2026

- 29 Karten gelesen; keine Karte ohne Titel oder Beschreibung gefunden.
- 24 leere, nicht benötigte Checklisten aus der Vorlage nach ausdrücklicher Bestätigung entfernt. Alle 29 Karten und alle bisherigen Arbeitsschritte wurden erhalten.
- Damals wurden 145 Arbeitsschritte dokumentiert: die bisherigen 144 sowie ein zusätzlicher Schritt zum Prüfen des Frontend-Starts und Abstimmen des Ordnerumzugs mit Dilek.
- Die befüllten Arbeitsschritte gehören zu den jeweiligen Funktionen beziehungsweise Prüfaufgaben.
- Doppelte Planungsarbeit wurde abgegrenzt: API-Inhalte werden auf der API-Planungskarte ergänzt; die Dokumentenprüfung liest und prüft diese Unterlagen.
- Die beiden erledigten Karten anhand der vorhandenen Projektdateien geprüft und als reine Dokumentations- beziehungsweise Strukturarbeit bezeichnet.
- Sicherheit, Tests und Dokumentation als begleitende Arbeit eingeordnet.
- Hand-out, Spezifikation, Datenmodell und README mit der Board-Arbeitsweise abgeglichen.
- Der API-Plan wurde als Entwurf gekennzeichnet und lesbar gegliedert; die fehlenden Datenformate wurden nicht als bereits vereinbart ausgegeben.

Dieser Stand beschreibt eine Prüfung der Planung und Dateien. Er ersetzt keinen erfolgreichen Start oder Funktionstest der späteren Anwendung.

## Historische Ergänzung zur Prüfung vom 30.10.2026

- Die fünf Prüfspalten enthalten jetzt je eine zusätzliche Erklärungskarte mit dem Etikett „Information“.
- Diese Karten erklären Zweck, Beispiel, Einstieg und Abschlusskriterien. Sie sind keine zusätzlichen Funktionsaufgaben und werden nicht als abgeschlossene Entwicklung gezählt.
- Der damals dokumentierte Stand betrug dadurch 34 Karten: die bisherigen 29 und fünf Erklärungskarten. Die 145 Arbeitsschritte blieben erhalten. Das ist kein aktueller Live-Abgleich.
- Die aktualisierte Rücksprache-Regel steht in `backend/AGENTS.md` und gilt für die Zusammenarbeit mit Josephine. Sie ersetzt keine separat vereinbarten Regeln für Dileks Frontend.

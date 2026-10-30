# Your Meme – Projektstand und Arbeitsweise

Stand: 30.10.2026. Abgabe: 23.11.2026. Präsentationstermin noch offen.

## Tatsächlich erledigt

- **Planungsentwurf gespeichert:** Datenmodell mit sechs Modellen, Beziehungen, Berechtigungen und Kontolöschung; Backend-Anforderungen und Backend-Regeln liegen als Dateien vor.
- **Ordnerstruktur angelegt:** Das bestehende Vite-Projekt liegt unter `frontend/`; Backend-Planung unter `backend/`; die gemeinsame README verweist auf diese Bereiche.
- Diese beiden Ergebnisse sind vollständig im genannten kleinen Umfang. Sie bedeuten keine fertige Datenbank, API, Anmeldung oder Anwendung.
- Das gemeinsame Durchsprechen und die fachliche Prüfung des Entwurfs bleiben eine eigene offene Aufgabe.
- Der Start der Anwendung nach dem Umzug ist noch zu prüfen. Die neue Struktur muss mit Dileks Arbeitsstand abgestimmt werden.

## Noch offen

- Datenbeziehungen sicher erklären, insbesondere Ersteller, Ordnerbesitzer und FolderMeme.
- Seitenstruktur und vorläufige Router-Wahl mit Dilek abstimmen.
- API-Datenformate vollständig festlegen. `api-plan.md` enthält bisher nur die fünf Meme-Endpunkte.
- Ausführbares Backend, Prisma-Schema, Datenbank, Clerk-Anbindung und Bildspeicher einrichten.
- Kernfunktionen umsetzen und Frontend und Backend verbinden.
- Tests, vollständige Startanleitung und Präsentation erstellen.

## Vorhandene Branches

- `Backend`: Josephines Arbeitsbranch; bei der Prüfung aktiv.
- `Frontend`: Dileks Arbeitsbranch.
- `main`: gemeinsamer Hauptbranch.
- Alle drei Branches sind lokal vorhanden. Ein Branch umfasst den Entwicklungsstand des gesamten Repositorys und ist nicht mit dem gleichnamigen Arbeitsbereich zu verwechseln.
- Die Ordnerumstellung wurde im aktiven Backend-Arbeitsstand vorgenommen. Sie ist damit nicht automatisch in Dileks Branch oder in `main` übernommen. Das wird gemeinsam abgestimmt.

## Sinnvolle Reihenfolge

1. Datenmodell verstehen, Seiten skizzieren und benötigte Daten gemeinsam festlegen.
2. Backend-Grundgerüst einrichten; Datenbank mit Prisma anbinden.
3. Öffentliche Meme-Liste und Detailseite mit Testdaten verbinden. Die Anmeldung kann parallel vorbereitet werden.
4. Clerk-Anmeldung und lokale Nutzerprofile verbinden, bevor geschützte Schreibfunktionen genutzt werden.
5. Bildspeicher auswählen; Upload, Bearbeiten und Löschen eigener Memes umsetzen.
6. Likes, Kommentare und persönliche Ordner ergänzen.
7. Administratorfunktionen und Kontolöschung vollständig verbinden.
8. Gemeinsame Abschlussprüfung, Demo und Abgabe vorbereiten.

**Während aller Schritte:** Eingaben prüfen, Rechte kontrollieren, passende Tests ergänzen, auf kleine Bildschirme und Tastaturbedienung achten und Dokumentation aktualisieren.
Begleitende Karten stehen deshalb im Board früh in der Liste; sie müssen nicht vollständig abgeschlossen sein, bevor die erste Funktion beginnt.

## Trello lesen

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
- Es gibt nun 145 Arbeitsschritte: die bisherigen 144 sowie einen zusätzlichen Schritt zum Prüfen des Frontend-Starts und Abstimmen des Ordnerumzugs mit Dilek.
- Die befüllten Arbeitsschritte gehören zu den jeweiligen Funktionen beziehungsweise Prüfaufgaben.
- Doppelte Planungsarbeit wurde abgegrenzt: API-Inhalte werden auf der API-Planungskarte ergänzt; die Dokumentenprüfung liest und prüft diese Unterlagen.
- Die beiden erledigten Karten anhand der vorhandenen Projektdateien geprüft und als reine Dokumentations- beziehungsweise Strukturarbeit bezeichnet.
- Sicherheit, Tests und Dokumentation als begleitende Arbeit eingeordnet.
- Hand-out, Spezifikation, Datenmodell und README mit der Board-Arbeitsweise abgeglichen.
- Der API-Plan wurde als Entwurf gekennzeichnet und lesbar gegliedert; die fehlenden Datenformate wurden nicht als bereits vereinbart ausgegeben.

Dieser Stand beschreibt eine Prüfung der Planung und Dateien. Er ersetzt keinen erfolgreichen Start oder Funktionstest der späteren Anwendung.

## Ergänzung nach der Prüfung

- Die fünf Prüfspalten enthalten jetzt je eine zusätzliche Erklärungskarte mit dem Etikett „Information“.
- Diese Karten erklären Zweck, Beispiel, Einstieg und Abschlusskriterien. Sie sind keine zusätzlichen Funktionsaufgaben und werden nicht als abgeschlossene Entwicklung gezählt.
- Das Board enthält dadurch 34 Karten: die bisherigen 29 und fünf Erklärungskarten. Die 145 Arbeitsschritte bleiben erhalten.
- Die aktualisierte Rücksprache-Regel steht in `backend/AGENTS.md` und gilt für die Zusammenarbeit mit Josephine. Sie ersetzt keine separat vereinbarten Regeln für Dileks Frontend.

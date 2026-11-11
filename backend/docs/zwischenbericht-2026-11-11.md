# Zwischenbericht für Dilek – 11.11.2026

Stand: kurz vor der Mittagspause, Codeabgleich mit Backend-Commit 1709a2d. Die Ergebnisse sind nach vorhandenem Code, aktuellen Prüfungen und Josephines bestätigten Funktionstests getrennt bewertet.

## Was ich im Backend bisher geschafft habe

- PostgreSQL und Prisma laufen mit dem vereinbarten Datenmodell. Öffentliche Meme-Liste, einzelne Memes und Kommentare sind abrufbar. Ersteller sowie Like-/Kommentaranzahl werden ausgegeben.
- Clerk erkennt die Anmeldung. Ein angemeldeter Nutzer kann sein lokales Profil anlegen beziehungsweise aktualisieren; wiederholte Aufrufe erzeugen keinen zweiten Nutzer für dieselbe Clerk-ID.
- Cloudinary ist eingerichtet und die Verbindung wurde erfolgreich getestet. Unsere Bild-Testdaten können jetzt mit dem Importskript auf beiden Rechnern eingerichtet werden. Josi bestätigt, dass es inzwischen bei dir läuft.
- Die Upload-Prüfung nimmt einen Titel und genau eine PNG-Datei bis 5 MiB an. Anmeldung, Titel, Dateigröße und PNG-Signatur werden geprüft. Ein erfolgreicher Postman-Test lieferte: Upload-Prüfung erfolgreich. Noch nichts gespeichert.
- Die Funktion zum Übertragen des Bildes zu Cloudinary ist geschrieben, aber noch nicht mit der Upload-Route verbunden.

## Wo wir stehen

Die Übersicht lädt API-Daten und Bilder. Im geprüften gemeinsamen Code verwendet die Detailseite aber weiterhin Beispieldaten; der Listen-Client setzt den Ersteller noch auf Community. Upload-Formular und Likes speichern noch nicht dauerhaft. Neue oder unveröffentlichte Arbeiten auf deinem Rechner sind damit nicht bewertet.

Der vollständige Upload ist noch nicht fertig: Es fehlen die Verknüpfung mit dem lokalen Ersteller, der Cloudinary-Aufruf aus der Route und die Meme-Speicherung in PostgreSQL. Die Antwort 200 bestätigt bisher nur die Prüfung. Bearbeiten/Löschen, echte Likes, Kommentarverwaltung, Ordner, Moderation und Kontolöschung bleiben offen.

## Was ich heute noch vorhabe

1. Den lokalen Nutzer anhand der geprüften Clerk-ID finden, bevor ein Bild hochgeladen wird.
2. Die vorhandene Cloudinary-Funktion in die Route einbauen und Bildadresse/Public ID übernehmen.
3. Das Meme mit Titel und lokalem Ersteller in PostgreSQL speichern.
4. Falls die Datenbankspeicherung scheitert, das neu hochgeladene Bild bereinigen und keinen Erfolg melden.
5. Einen vollständigen Upload und wichtige Fehlerfälle testen; danach gemeinsam die Verbindung zum Formular prüfen, sofern der API-Test rechtzeitig funktioniert.

Das sind Tagesziele, keine bereits erledigten Schritte. Eine generische Upload-Fehlermeldung sagt noch JPG/JPEG; sie muss an die tatsächlich geltende PNG-Regel angepasst werden.

## Was du parallel machen kannst

- Die bestehende Detailseite an GET /api/memes/ID anschließen und das echte Bild anzeigen.
- author aus der API übernehmen, statt Community einzutragen.
- Für den späteren Upload das vorhandene Formular auf ein PNG bis 5 MiB vorbereiten: FormData-Felder title und image, Session-Token als Bearer Header. Content-Type samt Boundary vom Browser setzen lassen.
- Erst nach erfolgreichem API-Speichern eine Veröffentlichung bestätigen. Die derzeitige Upload-Prüfung legt noch kein Meme an.

## Abstimmung heute

Kurzer Austausch möglichst vor 12 Uhr: Regeln und Feldnamen bestätigen, offene Fragen klären. Mittagspause 12–13 Uhr. Am Nachmittag zuerst Cloudinary und Datenbank verbinden, anschließend gemeinsam testen; zum Tagesende Ergebnis und verbleibende Fehler festhalten. Keine neuen Likes-/Ordner-Baustellen beginnen, solange der Upload noch nicht vollständig funktioniert.

## Wie liegen wir in der Zeit?

Bis zum 19.11. bleiben einschließlich heute sieben Werktage; die Abgabe ist am 23.11. Der ursprüngliche Plan sah Kernfunktionen bis 18.11. und Test-/Vorbereitungstage am 19.–20.11. vor.

Es gibt sichtbaren Fortschritt bei Anmeldung, Datenanzeige und Upload-Prüfung. Der vollständige vereinbarte Umfang bis 18./19.11. ist trotzdem gefährdet: Mehrere große Nutzerfunktionen und ihre Rechteprüfungen fehlen noch. Eine verlässlich vorführbare Kernversion ist realistischer als eine Zusage für alle Funktionen. Am Freitag, 13.11., sollten wir anhand der tatsächlich fertigen Abläufe gemeinsam neu priorisieren und bei Bedarf mit der Kursleitung klären. Anforderungen werden dadurch nicht automatisch gestrichen.

## Prüfungen dieses Abgleichs

Backend-Typprüfung, Prisma-Validierung, Frontend-Typprüfung der App und Lint erfolgreich. Live-GETs: health, health/db und memes mit 200; Datenbank connected, 29 Memes; CORS für localhost:5173 vorhanden. GET /api/me ohne Anmeldung liefert 401. Angemeldete Tests und Upload-Erfolg beruhen auf Josephines bestätigten Ergebnissen; sie wurden beim Dokumentationsabgleich nicht mit einem neuen Session-Token wiederholt. Keine neuen Bilder oder Datenbankeinträge wurden für diesen Bericht angelegt.

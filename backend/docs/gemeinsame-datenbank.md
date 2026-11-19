# Gemeinsame PostgreSQL-Datenbank – Umzugsvorbereitung

Stand: 16.11.2026. Der freigegebene vollständige lokale Projektstand wurde nach Neon Frankfurt übertragen und vollständig mit der Quelle verglichen. Josephines lokale Backend-Konfiguration zeigt inzwischen auf das gemeinsame Ziel; das Backend wurde neu gestartet und lesend abgenommen. Beide ausdrücklich freigegebenen Backend-Zugänge sind angelegt und geprüft. Kein Passwort und keine vollständige Verbindungs-URL stehen in dieser Dokumentation.

## Angelegtes Ziel

Neon Free, Region Frankfurt (`aws-eu-central-1`), Projektname `your-meme`, Projekt-ID `ancient-scene-53479819`, PostgreSQL 18.7. Region, Version und Free-Tarif wurden im angemeldeten Konto bestätigt. Lokale Quelle: PostgreSQL 18.6. Keine kostenpflichtigen Erweiterungen, keine zusätzliche Authentifizierung oder Bildspeicherung aktivieren: Clerk und Cloudinary bleiben bestehen. Josephine hat 3 Nutzerprofile einschließlich Clerk-IDs, 30 Meme-Einträge, 1 Kommentar, 1 Like und 2 Ordner ausdrücklich zur Übertragung freigegeben.

Geprüfte Herstellerquellen: [Free-Tarif](https://neon.com/pricing), [Regionen](https://neon.com/docs/introduction/regions), [Neon Vertragsbedingungen](https://neon.com/platform-terms), [PostgreSQL-Import](https://github.com/neondatabase/website/blob/main/content/docs/import/migrate-from-postgres.md). Vertrags-/AVV-Fragen und die gewählte Datenregion vor dem Übertragen personenbezogener Daten prüfen; Frankfurt allein ist keine vollständige Datenschutzprüfung.

## Geprüfter lokaler Ausgangsstand

- PostgreSQL 18.6, Datenbank `your_meme_db`, ungefähr 8,5 MB.
- 3 Nutzerprofile, 30 Memes, 1 Kommentar, 1 Like, 2 Ordner, keine Ordner-Meme-Zuordnungen und keine offenen Bild-Bereinigungsaufträge.
- Profil-Datensätze enthalten unter anderem lokale UUID, Clerk-ID, Anzeigenamen und Rolle. Keine Passwörter werden vom Projekt gespeichert.
- Meme-Datensätze enthalten Bildadressen und Cloudinary-public_ids. Bilddateien bleiben bei Cloudinary; Datenbankumzug lädt keine Bilder neu hoch.
- Migrationen einschließlich Kategorien und `MemeImageDeletion` vorhanden.
- Vorläufige geschützte Sicherung im Custom-Format erstellt und per `pg_restore --list` auf Lesbarkeit, Meme-Daten und Prisma-Migrationshistorie geprüft. Das ist noch kein erfolgreicher Wiederherstellungstest. Sicherung enthält personenbezogene Daten und bleibt lokal außerhalb des Repositorys.

## Durchgeführter Umzug und Abnahme

- Neues leeres Ziel in Frankfurt angelegt; keine anderen Neon-Projekte verändert.
- Verbindung mit TLS 1.3 und gültigem Serverzertifikat am Client geprüft. Die öffentliche Neon-Proxy-Verbindung wurde geprüft; `pg_stat_ssl` innerhalb der Plattform ist dafür allein kein ausreichender Nachweis.
- Backend für den finalen Abzug kurz angehalten. Projekt-Tabellen während Export und Vergleich mit SHARE-Sperren gegen Schreibzugriffe gesichert.
- Nach Kategorienmigration frischen vollständigen Dump erstellt, atomar mit pg_restore importiert (keine bestehenden Zieltabellen überschrieben), alle Tabellen und Migrationshistorie datensatzweise verglichen. Alle freigegebenen Mengen stimmen überein; 4 Migrationen übernommen, Kategorie-CHECK vorhanden. Keine Cloudinary-Bilder neu hochgeladen oder gelöscht.
- `DATABASE_URL` ausschließlich in der lokalen, von Git ausgeschlossenen Backend-Konfiguration umgestellt. Backend erneut gestartet.
- Live-Abnahme: Health 200, DB-Health 200/connected, Meme-Liste 200 mit 30 Memes. Arbeit: 3, Tiere: 2, Spiele: 2, Kaffee: 0. Alte Kategorie Animal: erwartete 400-Antwort. Migrationsstatus aktuell, keine offenen Bildlöschaufträge. Noch keine gemeinsame authentifizierte Upload-Abnahme mit Dilek.
- Die ursprüngliche lokale Datenbank bleibt erhalten. Autoritatives Rückfallarchiv geschützt unter `/tmp/your-meme-final-move-Hv9FiQ/your-meme-final.dump`; dort liegt auch die bisherige lokale Datenbankverbindung. Nach gemeinsamer Abnahme Rückfallfrist vereinbaren und temporäre Kopien löschen. Keine erneute Übernahme aus der lokalen Quelle ohne Abgleich neuer gemeinsamer Daten.
- Nach Josephines ausdrücklicher Freigabe zwei getrennte Backend-Logins eingerichtet: `your_meme_backend_a` für Josephine, `your_meme_backend_b` für Dilek. Nur CRUD auf den sieben Projekttabellen, SELECT auf der Migrationshistorie, kein CREATE im öffentlichen Schema. Beide Zugänge mit TLS/Zertifikatsprüfung und 30 lesbaren Memes geprüft. Josephines DATABASE_URL verwendet nun Rolle a; DIRECT_DATABASE_URL enthält getrennt den Migrations-/Eigentümerzugang. Prisma CLI nutzt DIRECT_DATABASE_URL, falls gesetzt, sonst DATABASE_URL. Dileks Rolle b steht nur in der geschützten lokalen `.env.dilek.local` (Git-ignoriert, Dateimodus 600). Keine Nachricht an Dilek versendet.

## Neuer Kategorienvertrag (19.11.2026)

Der Backend-Branch verwendet nun Programmieren, Alltag, Arbeit, Sport, Spiele, Technik, Tiere, Filme, Draußen, Lernen, Getränke, Essen, Urlaub, Bücher und Besprechungen, plus `Ohne Kategorie`. `Alle Memes` ist nur ein Filter. Migration `20261119120000_frontend_categories` ist im Repository, wurde durch diese Aenderung aber **nicht** auf Neon ausgefuehrt. Die nachfolgenden Schritte beschreiben den bisherigen Stand und sind vor dem neuen Deployment entsprechend anzupassen.

## Anschluss für Dilek

1. Aktuellen Backend-Stand einschließlich `20261116180000_german_categories` verwenden. Die Kategorien lauten jetzt Arbeit, Programmieren, Kaffee, Tiere, Essen, Lernen, Spiele, Zuhause und Wochenende plus Ohne Kategorie. Menü und Upload müssen diese Werte senden; Gaming wird Spiele. Frontend-Dateien wurden hier nicht geändert.
2. Josephine gibt Dilek ausschließlich die lokale Datei `backend/.env.dilek.local` über einen privaten Weg. Sie enthält nur die neue DATABASE_URL für Rolle b. Dilek ersetzt damit genau diese Variable in ihrer eigenen backend/.env; übrige Clerk-/Cloudinary-Werte bleiben erhalten. Bei Dilek DIRECT_DATABASE_URL weglassen bzw. eine alte lokale Definition entfernen, damit Prisma Studio/Status nicht versehentlich eine andere Datenbank verwenden. Gleiche Clerk-Anwendung nutzen. Keine Verbindungsdaten ins Frontend oder nach Git übernehmen; niemals Josephines gesamte .env weitergeben.
3. Backend neu starten, Health und DB-Health prüfen, danach Kategorien laden. Kein eigener Fixture-Import, keine erneute Kategorie-SQL-Aktualisierung auf dem gemeinsamen Ziel und keine lokalen Testdaten ungeprüft in die gemeinsame DB importieren.
4. Änderungen/Löschungen wirken auf beide Backends. Schema-Migrationen führt Josephine abgestimmt mit ihrem getrennten Migrationszugang aus. PostgreSQL-Integrationstests weiterhin ausschließlich lokal laufen lassen; die gemeinsame DB ist kein Testziel für diese Tests.

## Ablauf als Referenz für spätere Umzüge

1. Leeres Neon-Projekt in Frankfurt im kostenlosen Tarif anlegen. Direkte, ungepoolte PostgreSQL-Verbindung für den Import verwenden. TLS und Serveridentität entsprechend dem Anbieter und dem verwendeten pg-Treiber prüfen; Zertifikatsprüfung nicht abschalten. Keine Zugangsdaten in Chat, Dokumentation oder Git übernehmen.
2. Beide lokalen Backends für den finalen Datenabzug in eine vereinbarte Schreibpause bringen. Die vorläufige Sicherung vorher nicht als endgültigen Datenstand behandeln: neuere Uploads/Kommentare könnten sonst fehlen.
3. Datenumfang ausdrücklich festlegen: vollständiger bisheriger Projektstand oder ausschließlich die 29 Demo-Memes mit synthetischem Demo-Profil. Demo-only erfordert einen getrennten Export ohne echte Nutzerprofile und Interaktionen; dafür nicht den vollständigen Dump verwenden.
4. Frische Sicherung erstellen. Vor dem Import Zielhostname/Region und leere Zieldatenbank kontrollieren. Wiederherstellung mit `pg_restore --single-transaction --exit-on-error --no-owner --no-privileges`; keine bestehenden Tabellen bereinigen/überschreiben. Rollen/Passwörter der lokalen Datenbank werden nicht übernommen. Prisma-Migrationshistorie bleibt beim vollständigen Import erhalten; keine zweite Init-Migration erzeugen.
5. Tabellen, FK-Kaskaden, Kategorie-CHECK, Migrationen und Anzahl/Zuordnung der übertragenen Datensätze im Ziel prüfen. Quelle bleibt als Rückfallmöglichkeit bestehen. Ein leeres Ziel und verifizierte Übernahme sind Voraussetzung für die Umschaltung.
6. Erst danach Josephines lokale `backend/.env` gezielt auf die verifizierte gemeinsame Verbindung umstellen. Andere Werte unverändert lassen. Dilek erhält einen passenden eigenen Datenbankzugang über einen privaten Weg und stellt ihre lokale Backend-Konfiguration selbst um. Die Datenbank wird niemals direkt mit dem Frontend verbunden.
7. Beide Backends mit identischem aktuellem Schema und derselben Clerk-Anwendung neu starten. Health/DB-Health, Kategorie-GET, Anmeldung und einen eigens angelegten Upload gemeinsam prüfen. Neue Uploads müssen nach Neuladen auf beiden Rechnern erscheinen. Keine gemeinsame Fixture-Datei für echte Löschtests verwenden.
8. Erst nach erfolgreicher Abnahme Schreibpause beenden. Temporäre Exportdateien nach Ende des Sicherungszwecks löschen; Zeitraum für das lokale Rückfall-Backup vereinbaren. Quelle nicht parallel weiterbeschreiben und später ungeprüft zurückspielen.

## Zusammenarbeit danach

Beide Backends arbeiten mit denselben Datensätzen; Änderungen und Löschungen wirken sich auf beide aus. Migrationen werden abgestimmt von einer Person ausgeführt und anschließend über Git geteilt. Der Bildbereinigungsdienst läuft bei beiden gegen dieselbe Warteschlange; wiederholte Dateibereinigung ist idempotent. Die Datenbankzugänge gehören ausschließlich in die jeweilige lokale Backend-Konfiguration.

Automatisierte PostgreSQL-Integrationstests bleiben auf der lokalen Testumgebung: `RUN_DATABASE_TESTS=1` nicht mit dem gemeinsamen Cloud-Ziel verwenden. Der vorhandene Integrationstest verweigert nichtlokale Ziele. Die normalen HTTP-Tests simulieren Dienste und können weiter genutzt werden.

Zusätzlich erfolgreich geprüft: Ein über Rolle b angelegter und geänderter eigener Testdatensatz war sofort über Josephines laufende HTTP-API (Rolle a) lesbar. Der Testdatensatz und sein synthetisches Profil wurden vollständig entfernt; anschließend wieder 30 Memes, keine Cloudinary-Aufrufe. Ausstehend: Dileks lokale Umschaltung und gemeinsame authentifizierte Browser-/Upload-Abnahme. Kontolöschung und vereinbarte Backup-/Log-Aufbewahrung bleiben eigenständige offene Punkte.

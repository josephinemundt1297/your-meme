# Backend-Regeln für Your Meme

Diese Regeln gelten ausschließlich für `backend/` und dessen Unterordner.
Sie legen keine Regeln für Dileks Frontend fest.

- **KEIN OVERENGINEERING. KISS-Prinzip (Keep It Simple).**
- **Keine Änderung ohne vorherige Rücksprache und ausdrückliche Freigabe durch Josephine.** Das gilt für Code, Dateien, Ordnerstruktur und Änderungen am Trello-Board im Rahmen dieser Zusammenarbeit.
- Eine konkrete Änderungsanweisung ist die Freigabe ausschließlich für den ausdrücklich beschriebenen Umfang. Sie erlaubt keine zusätzlichen Änderungen, Commits, Pushes oder Zusammenführungen von Branches.
- Ist eine Anweisung nicht zu 100 Prozent klar, vor der betroffenen Änderung gezielt nachfragen und die Antwort abwarten. Keine eigenmächtigen Annahmen über den Änderungsumfang treffen.
- Keine Fakten, Anforderungen, Entscheidungen oder Fortschritte erfinden. Belegten Stand, offene Fragen und Vorschläge klar unterscheiden. Gewünschte Beispiele ausdrücklich als Beispiele kennzeichnen.
- Die einfachste verständliche Lösung wählen, die die vereinbarten Anforderungen zuverlässig erfüllt.
- Nur tatsächlich benötigte Technologien und Dienste verwenden. Im Kurs behandelte Alternativen müssen nicht gleichzeitig eingesetzt werden.
- Keine zusätzlichen Funktionen, Abstraktionen, Infrastruktur oder Pakete ohne konkreten Bedarf einführen.
- Notwendige Validierung, Berechtigungsprüfungen und Fehlerbehandlung einfach und nachvollziehbar umsetzen.
- Der Nutzer möchte den Anwendungscode selbst tippen. In kleinen, erklärten Schritten begleiten; Anwendungscode nur auf ausdrücklichen Wunsch ändern.
- Dokumentation und Projektregeln nur im ausdrücklich beauftragten Umfang und am genannten Speicherort speichern oder ändern.
- Schwierige Konzepte wie Datenbeziehungen mit kleinen Teilbildern und konkreten Beispieldaten erklären. Erst das Verständnis festigen, bevor der nächste Umsetzungsschritt beginnt.
- Vereinbarter Backend-Stack: Node.js, Express, TypeScript, PostgreSQL, Prisma und Clerk. Bildspeicher noch offen; Deployment ist freiwillig.
- Fachliche Backend-Anforderungen stehen in `SPECK.md`; Datenmodell und API-Plan in `docs/`. Widersprüche prüfen, nötige Änderungen vorschlagen und nur mit ausdrücklicher Freigabe ausführen.

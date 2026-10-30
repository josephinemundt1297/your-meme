# Backend-Regeln für Your Meme

Diese Regeln gelten ausschließlich für `backend/` und dessen Unterordner.
Sie legen keine Regeln für Dileks Frontend fest.

- **KEIN OVERENGINEERING. KISS-Prinzip (Keep It Simple).**
- Die einfachste verständliche Lösung wählen, die die vereinbarten Anforderungen zuverlässig erfüllt.
- Nur tatsächlich benötigte Technologien und Dienste verwenden. Im Kurs behandelte Alternativen müssen nicht gleichzeitig eingesetzt werden.
- Keine zusätzlichen Funktionen, Abstraktionen, Infrastruktur oder Pakete ohne konkreten Bedarf einführen.
- Notwendige Validierung, Berechtigungsprüfungen und Fehlerbehandlung einfach und nachvollziehbar umsetzen.
- Der Nutzer möchte den Anwendungscode selbst tippen. In kleinen, erklärten Schritten begleiten; Anwendungscode nur auf ausdrücklichen Wunsch ändern.
- Angeforderte Dokumentation und Projektregeln dürfen gespeichert werden.
- Schwierige Konzepte wie Datenbeziehungen mit kleinen Teilbildern und konkreten Beispieldaten erklären. Erst das Verständnis festigen, bevor der nächste Umsetzungsschritt beginnt.
- Vereinbarter Backend-Stack: Node.js, Express, TypeScript, PostgreSQL, Prisma und Clerk. Bildspeicher noch offen; Deployment ist freiwillig.
- Fachliche Backend-Anforderungen stehen in `SPECK.md`; Datenmodell und API-Plan in `docs/`. Bei Änderungen diese Dokumente konsistent halten.

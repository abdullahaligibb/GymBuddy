# GymBuddy

GymBuddy ist die Fitness-App der Projektgruppe LAAG, Klasse IM24A: Abdullah Ali, Gabriel Maurer, Arion Zeqaj und Loris Pérez. Das Projekt verbindet React Native mit Expo und TypeScript sowie ein Express-Backend mit Prisma und PostgreSQL.

## Stand am 25. November 2026

Der Frontend-Prototyp verwendet Demo-Daten. Trainingsänderungen bestehen innerhalb der laufenden App-Sitzung und gehen beim Neuladen verloren. Die Navigation unten ist bisher eine Darstellung ohne Seitenwechsel. Anmeldung und Backend sind noch nicht mit der App verbunden.

Abdullahs Übungsbibliothek, Trainingsübungseditor, Vorlagenübernahme und Ernährungstipps sind im Prototyp bedienbar. Die Komponenten können über Daten und Rückruffunktionen unabhängig vom Backend entwickelt und geprüft werden. Ein Adapter für den bestehenden Übungskatalog-Endpunkt liegt vor; `App.tsx` ruft ihn noch nicht auf.

## Frontend starten und prüfen

```sh
cd frontend
npm ci
npm run typecheck
npm test
npm run web
```

Für ein Gerät: `npm start` im Frontend ausführen und die Hinweise von Expo verwenden. Die dokumentierten Browserprüfungen ersetzen noch keinen Test auf Android oder iOS.

## Dokumentation

- [Aufgaben und Projektplanung](docs/project-plan.md)
- [Architektur und Integrationsverträge](docs/architecture.md)
- [Installation und Betrieb](docs/setup.md)
- [Bedienungsanleitung](docs/user-guide.md)
- [Testnachweise und offene Abnahme](docs/testing.md)
- [Vorbereitung der Projektpräsentation](docs/presentation.md)

Die historischen Konzept- und Testkonzeptunterlagen bleiben als damaliger Planungsstand erhalten. Die aktuelle Backend-Erweiterung und die Abweichungen zur ursprünglich lokalen Speicherung sind in der Architektur dokumentiert. Ein vollständiger Abschluss des Gesamtprojekts ist noch nicht nachgewiesen.

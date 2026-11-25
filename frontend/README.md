# GymBuddy Frontend

React Native, Expo und TypeScript. Der aktuelle Prototyp zeigt Demo-Daten; Änderungen werden derzeit im Arbeitsspeicher gehalten. Siehe [Projektübersicht](../README.md) für den aktuellen Stand und die Zuständigkeiten.

## Starten

```bash
npm ci
npm run typecheck
npm test
npm start
```

Danach kann die App mit Expo Go auf dem Handy geöffnet oder auf einem
Android-/iOS-Emulator gestartet werden.

## Aktueller Stand

- React Native + Expo + TypeScript
- Mobile Dark-Mode Layout
- Bottom Navigation als Basis
- Dashboard mit Wochenziel, Streak und Kurzstatistik
- Horizontaler Wochenkalender mit Demo-Trainings
- Übungsbibliothek mit Suche, kombinierten Filtern und Details
- Trainingsübungen mit Entwurf, Validierung und Bearbeitung
- Unabhängige Kopien von Workout-Vorlagen mit Ersetzungsbestätigung
- Ernährungstipps mit Suche, Kategorien und Details
- Workout-Formular im Prototyp
- Noch keine dauerhafte Speicherung und keine Backend-Verbindung in App.tsx

## Zusammenarbeit

Die aktualisierte Aufteilung steht im [Projektplan](../docs/project-plan.md). Die frühere reine Offline-Planung wurde um das von Loris entwickelte Backend ergänzt. Die Zusammenführung der Datenflüsse ist noch offen.

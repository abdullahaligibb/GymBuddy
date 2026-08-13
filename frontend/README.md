# Gym Buddy Mobile Base

Gym Buddy ist eine kleine React-Native-Startversion für eine Gym- und
Fitness-App im Modul 306. Die Base ist bewusst noch nicht komplett fertig.
Sie zeigt bereits ein mobiles Dashboard, einen Wochenkalender, einen
Streak-Begleiter und erste Übungen.

## Starten

```bash
npm install
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
- Erste Übungsbibliothek
- Noch keine echte Formularlogik
- Noch kein LocalStorage
- Noch keine ausgebauten Detailseiten

## Geplante Aufteilung

Die nächsten Schritte können in vier getrennten Commits umgesetzt werden:

- Gabriel: Grundlogik, Datenmodell und LocalStorage
- Arion: Kalender und Workout-Formular
- Abdullah: Übungsbibliothek und Workout-Vorlagen
- Loris: Design-Polish, Mobile-Navigation, Fortschritt und Ernährung

# GymBuddy Frontend

React Native, Expo und TypeScript. Standardmässig arbeitet die App mit einer simulierten API. Auf dem Anmeldebildschirm öffnet **Demo öffnen** ein vorbereitetes Profil. Für die Registrierung im Simulator bitte Beispieladressen und Testpasswörter eingeben.

## Starten

```bash
npm ci
npm run typecheck
npm test
npm start
```

Danach kann die App mit Expo Go auf dem Handy geöffnet oder auf einem
Android-/iOS-Emulator gestartet werden. Für die Browser-Vorschau `npm run web` ausführen.

## Aktueller Stand

- React Native + Expo + TypeScript
- Mobile Dark-Mode Layout
- Geschützte Tabs und Profilansicht mit Abmeldung
- Registrierung und Login über die simulierte API
- Dashboard mit Wochenziel, Streak und Kurzstatistik
- Horizontaler Wochenkalender mit Demo-Trainings
- Übungsbibliothek mit Suche, kombinierten Filtern und Details
- Trainingsübungen mit Entwurf, Validierung und Bearbeitung
- Unabhängige Kopien von Workout-Vorlagen mit Ersetzungsbestätigung
- Ernährungstipps mit Suche, Kategorien und Details
- Workout-Formular im Prototyp
- Makroziele und korrigierbare Tageswerte unter **Ernährung**

## Datenvertrag und Testbetrieb

`src/services/api.ts` definiert `AppApi` für Authentifizierung, Trainingspläne, Workouts, Übungen, Profile und Makrodaten. `GymBuddyApp` akzeptiert eine Implementierung als `api`-Prop. Standard ist `createMockApi()`. Für reproduzierbare Tests lassen sich eine feste Uhr (`now`) und ein Fehler vor jedem Aufruf (`before`) übergeben.

- Ein Kalendertag ist ein lokales Datum `YYYY-MM-DD`, die Trainingszeit ist `HH:mm`. `ungeplant` steht für einen Platzhalter im Kalender, `ruhe` für einen gespeicherten Ruhetag.
- Der Workout-Adapter übersetzt `name`, `date`, `duration` und die Statuswerte `GEPLANT`, `ERLEDIGT`, `VERPASST`, `RUHE`. Er sortiert die Übungszuordnungen nach `position`. Die Zuordnungs-ID bleibt von der Katalog-ID getrennt. Externe IDs tragen im Frontend das Präfix `api:`. Wiederholungen sind Text, damit Bereiche und Zeitangaben erhalten bleiben.
- Profile, Workouts, Trainingspläne und Makrowerte sind pro Konto getrennt. Die simulierten Konten und Änderungen leben im Arbeitsspeicher. Android und iOS legen den Sitzungstoken mit [Expo SecureStore](https://docs.expo.dev/versions/v54.0.0/sdk/securestore/) ab. Die Demo-Sitzung kann damit innerhalb ihrer Gültigkeit erneut geprüft werden. Der Browser hält den Token bis zum Neuladen im Arbeitsspeicher.
- Bei abgelaufener Anmeldung entfernt die App Sitzung und angezeigte Kontodaten. Ein Verbindungsfehler beim Speichern lässt den Entwurf stehen. Der echte Backend-Transport gehört zur gemeinsamen Integration. Die vorhandenen Express-Endpunkte werden von dieser Demo-App noch nicht aufgerufen.

## Statistik und Makroregeln

Die Statistik verwendet die aktuelle lokale Woche von Montag bis Sonntag. Ein Wochen-Streak zählt aufeinanderfolgende Wochen, in denen das Trainingsziel erreicht wurde. Eine laufende Woche vor Zielerreichung beendet den vorherigen Streak noch nicht. Als nächstes Training zählt der früheste geplante Termin ab der aktuellen Uhrzeit, auch in einer späteren Woche.

Die App verwendet die [Mifflin-St.-Jeor-Gleichung](https://pubmed.ncbi.nlm.nih.gov/2305711/) als Schätzung für Erwachsene mit gewählter Berechnungsvariante. Sie multipliziert den geschätzten Ruhebedarf mit 1.2, 1.375, 1.55 oder 1.725 gemäss Aktivität. Als Projektregel kommen bei Muskelaufbau 200 kcal hinzu, bei Fettabbau werden 300 kcal abgezogen. Für Kraftaufbau und allgemeine Fitness bleibt der Schätzwert gleich. In die Aufteilung gehen 1.6 g Protein pro kg Körpergewicht und 25 Prozent der Energie aus Fett ein. Kohlenhydrate ergeben sich aus der restlichen Energie. Gerundete Grammwerte werden wieder in kcal umgerechnet.

Jedes Tagesprotokoll erfasst Protein, Kohlenhydrate und Fett in ganzen Gramm. Die Energie ergibt sich mit 4, 4 und 9 kcal pro Gramm. Pro Datum und Konto gibt es einen Eintrag. Erneutes Speichern ersetzt ihn.

## Zusammenarbeit

Die aktualisierte Aufteilung steht im [Projektplan](../docs/project-plan.md). Die frühere reine Offline-Planung wurde um das von Loris entwickelte Backend ergänzt. Die Zusammenführung der Datenflüsse ist noch offen.

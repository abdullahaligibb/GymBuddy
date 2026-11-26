# GymBuddy Frontend

React Native, Expo und TypeScript. Ohne Konfiguration startet eine ausdrücklich gekennzeichnete Demo. **Demo öffnen** lädt Beispieldaten. Ein konfigurierter Serverbetrieb verwendet echte HTTP-Anfragen und fällt bei Fehlern nicht auf Demo-Daten zurück.

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
- Registrierung und Login über Demo oder echten Server
- Dashboard mit Wochenziel, Streak und Kurzstatistik
- Horizontaler Wochenkalender mit Demo-Trainings
- Übungsbibliothek mit Suche, kombinierten Filtern und Details
- Trainingsübungen mit Entwurf, Validierung und Bearbeitung
- Unabhängige Kopien von Workout-Vorlagen mit Ersetzungsbestätigung
- Ernährungstipps mit Suche, Kategorien und Details
- Workout-Formular im Prototyp
- Makroziele und korrigierbare Tageswerte unter **Ernährung**

## Datenvertrag und Testbetrieb

### Echten Server anschliessen

Die Datei `.env.example` enthält die öffentlichen Einstellungen. Für eine lokale `.env`:

```dotenv
EXPO_PUBLIC_API_MODE=server
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_CONTRACT=v1
```

Nach einer Konfigurationsänderung Expo neu starten. Auf einem Mobilgerät muss die Serveradresse den Entwicklungsrechner erreichen; dort bezeichnet `localhost` das Mobilgerät. In diese öffentlichen Variablen gehören keine Passwörter, JWT-Geheimnisse oder Datenbankzugänge.

`legacy` ist eine Kompatibilitätsoption für ältere Express-Server: Anmeldung, Registrierung, Kontoprüfung, Übungskatalog, Workouts lesen, Status ändern und löschen. Vollständiges Speichern, Profiländerungen, Pläne und Makrodaten werden ausdrücklich als noch nicht verfügbar gemeldet. Es werden keine unvollständigen Trainings durch mehrere Schreibaufrufe erzeugt. Bereits gespeicherte Übungen bleiben dank ihrer eingebetteten Metadaten auch bei einem ausgefallenen externen Katalog lesbar.

`v1` aktiviert den vollständigen Frontend-Vertrag aus [api-contract.md](../docs/api-contract.md). Die vollständigen Server-Routen sind implementiert und mit PostgreSQL sowie dem echten TypeScript-Client geprüft. Der Live-Browserlauf schliesst und öffnet den Browser und meldet sich neu an; Daten bleiben erhalten. Physische Geräte sind noch gesondert zu prüfen.

Demo und verschiedene Serveradressen verwenden getrennte Sitzungsschlüssel. Ein verspäteter 401-Fehler einer bereits verlassenen Sitzung meldet ein neu angemeldetes Konto nicht ab. Bei ungültiger Serverkonfiguration zeigt die App einen Konfigurationsfehler.

`src/services/api.ts` definiert `AppApi` für Authentifizierung, Trainingspläne, Workouts, Übungen, Profile und Makrodaten. `GymBuddyApp` akzeptiert eine Implementierung als `api`-Prop. `configuredApi` wählt anhand der Einstellungen Demo oder `createHttpApi()`. Im Demo-Prüfaufbau lassen sich eine feste Uhr (`now`) und ein Fehler vor jedem Aufruf (`before`) übergeben.

- Ein Kalendertag ist ein lokales Datum `YYYY-MM-DD`, die Trainingszeit ist `HH:mm`. `ungeplant` steht für einen Platzhalter im Kalender, `ruhe` für einen gespeicherten Ruhetag.
- Der Workout-Adapter übersetzt `name`, `date`, `duration` und die Statuswerte `GEPLANT`, `ERLEDIGT`, `VERPASST`, `RUHE`. Er sortiert die Übungszuordnungen nach `position`. Die Zuordnungs-ID bleibt von der Katalog-ID getrennt. Externe IDs tragen im Frontend das Präfix `api:`. Wiederholungen sind Text, damit Bereiche und Zeitangaben erhalten bleiben.
- Profile, Workouts, Trainingspläne und Makrowerte sind pro Konto getrennt. Die simulierten Konten und Änderungen leben im Arbeitsspeicher. Android und iOS legen den Sitzungstoken mit [Expo SecureStore](https://docs.expo.dev/versions/v54.0.0/sdk/securestore/) ab. Die Demo-Sitzung kann damit innerhalb ihrer Gültigkeit erneut geprüft werden. Der Browser hält den Token bis zum Neuladen im Arbeitsspeicher.
- Bei abgelaufener Anmeldung entfernt die App Sitzung und angezeigte Kontodaten. Ein Verbindungsfehler beim Speichern lässt den Entwurf stehen. Im Servermodus werden die vorhandenen Express-Endpunkte tatsächlich aufgerufen; der vollständige Funktionsumfang wartet auf die beschriebenen Backend-Erweiterungen.

### Übungskatalog und Planeditor

Übungsbibliothek, Planeditor, Trainingseditor, Vorlagenübernahme und Trainingsdetails verwenden denselben geladenen Katalog. Die mitgelieferten Einträge erhalten ihre IDs für bestehende Vorlagen; externe Übungen behalten `api:<externalId>`. Gleichnamige Übungen werden nicht als identisch geraten. Die Detaildaten gespeicherter Trainings ergänzen den Katalog, falls eine externe Übung in der geladenen API-Seite fehlt. Die vorhandene Katalogroute liefert höchstens 25 externe Einträge ohne Cursor-Metadaten; eine vollständige serverweite Suche setzt deren Erweiterung voraus.

Im Planeditor lassen sich Übungen hinzufügen, entfernen, sortieren und mit Sätzen, Wiederholungsbereichen oder Zeit, Gewicht, Pausen und Notizen bearbeiten. Name, Ziel, Dauer, Intensität und Muskelgruppen werden nach denselben Regeln wie bei der Übernahme geprüft. Abbrechen verlangt bei Änderungen eine Bestätigung; Speicherfehler erhalten den Entwurf.

### Prüfungen

`npm run typecheck` prüft die Typen, `npm test` führt die Logik- und HTTP-Vertragstests aus. Die optionalen Browserprüfungen unter `tests/browser/checks.cjs` verwenden Playwright. Bei bereitgestellter Playwright-Installation und laufendem Expo auf Port 8091: `node tests/browser/checks.cjs`. `PLAYWRIGHT_MODULE` setzt einen separaten Modulpfad; `CHECK_GROUP` begrenzt den Durchlauf beispielsweise auf `HTTP integration`.

Der lokale HTTP-Prüfserver wird ausschliesslich auf `127.0.0.1` mit freiem Port gestartet und danach beendet. Geprüft werden Speichern und erneutes Laden, vollständige Übungsvorgaben, Serverfehler ohne Datenverlust, Benutzertrennung und verspätete Sitzungsfehler. Er ersetzt keine Tests mit der tatsächlichen PostgreSQL-Instanz oder physischen Geräten.

## Statistik und Makroregeln

Die Statistik verwendet die aktuelle lokale Woche von Montag bis Sonntag. Ein Wochen-Streak zählt aufeinanderfolgende Wochen, in denen das Trainingsziel erreicht wurde. Eine laufende Woche vor Zielerreichung beendet den vorherigen Streak noch nicht. Als nächstes Training zählt der früheste geplante Termin ab der aktuellen Uhrzeit, auch in einer späteren Woche.

Die App verwendet die [Mifflin-St.-Jeor-Gleichung](https://pubmed.ncbi.nlm.nih.gov/2305711/) als Schätzung für Erwachsene mit gewählter Berechnungsvariante. Sie multipliziert den geschätzten Ruhebedarf mit 1.2, 1.375, 1.55 oder 1.725 gemäss Aktivität. Als Projektregel kommen bei Muskelaufbau 200 kcal hinzu, bei Fettabbau werden 300 kcal abgezogen. Für Kraftaufbau und allgemeine Fitness bleibt der Schätzwert gleich. In die Aufteilung gehen 1.6 g Protein pro kg Körpergewicht und 25 Prozent der Energie aus Fett ein. Kohlenhydrate ergeben sich aus der restlichen Energie. Gerundete Grammwerte werden wieder in kcal umgerechnet.

Jedes Tagesprotokoll erfasst Protein, Kohlenhydrate und Fett in ganzen Gramm. Die Energie ergibt sich mit 4, 4 und 9 kcal pro Gramm. Pro Datum und Konto gibt es einen Eintrag. Erneutes Speichern ersetzt ihn.

## Zusammenarbeit

Die aktualisierte Aufteilung steht im [Projektplan](../docs/project-plan.md). Die frühere reine Offline-Planung wurde um das von Loris entwickelte Backend ergänzt. Die Zusammenführung der Datenflüsse ist noch offen.

Der vollständige lokale Start mit Datenbank erfolgt vom Projektstamm über `npm run dev -- --host <WLAN-IPv4>`. Der Starter richtet öffentliche Frontend-Konfiguration und private Backend-Konfiguration getrennt ein.

# Tests und Nachweise

Stand 25.11.2026. Geprüft wurden Abdullahs Frontend-Funktionen im lokalen Entwicklungsstand einschliesslich der Ernährungstipps. Die Prüfungen liefen automatisiert; ein persönlicher Handtest aller vier Autoren wird damit nicht behauptet.

## Ausgeführte Prüfungen

- TypeScript-Prüfung ohne gemeldete Fehler.
- 19 automatisierte Logiktests, alle erfolgreich: 13 Tests zu Abdullahs Katalog, Editor, Vorlagen und Ernährung; zusätzlich sechs vorhandene Tests von Arion zu Kalender, Profil und Trainingsformular.
- Chrome im mobilen Browserformat 390 × 844: Übungssuche/Filter/Details, Editor-Eingabeprüfung, Hinzufügen/Entfernen/Sortieren, Speichern/erneut Öffnen und bewusstes Verwerfen erfolgreich.
- Separater Komponenten-Prüfaufbau: abgewiesenes Speichern im Editor und bei Vorlagen, erhaltene Eingaben und erfolgreicher erneuter Versuch geprüft. Der Fehler wurde durch eine absichtlich abgewiesene Speicherfunktion erzeugt; kein echter Serverausfall.
- Vorlagenübernahme in der tatsächlichen App: ungültige Uhrzeit, Ersetzungsbestätigung, Abbruch und übernommene Übungszuordnungen geprüft.
- Ernährungstipps: keine Treffer, Zurücksetzen, Suche mit Leerzeichen/Grossschreibung, kombinierte Kategorie und Detailanzeige geprüft.

In den erfolgreichen Browserdurchläufen wurden keine JavaScript-Seitenfehler erfasst. Während der Fehlerprüfung wurde ein Zurücksetzen der Vorlagenauswahl bei einer Eltern-Aktualisierung entdeckt, korrigiert und der Durchlauf erneut erfolgreich ausgeführt. Ein erster Prüfschritt erwartete irrtümlich Klimmzüge statt des in der Vorlage enthaltenen Latziehens; korrigiert wurde die Test-Erwartung.

## Wiederholung

Im Verzeichnis `frontend` die Befehle `npm run typecheck` und `npm test` ausführen. Die Testdateien liegen unter `frontend/tests`. Sie verwenden den eingebauten Node-Test-Runner und die vorhandene TypeScript-Installation. Der kleine Test-Lader übersetzt TypeScript für die Logiktests; die getrennte TypeScript-Prüfung bleibt deshalb zwingend.

Die wiederholbaren Browserprüfungen stehen in `frontend/tests/browser/checks.cjs`; der bewusst fehlschlagende Speicheraufruf liegt im separaten Prüfaufbau `harness.tsx`. Diese Datei ist kein Teil des App-Einstiegspunkts. Die Prüfungen erwarten den Entwicklungsserver auf Port 8091 und einen frisch geladenen aktuellen Kalender.

Geprüfte Werkzeuge: Node.js 24.22.3, TypeScript aus der Frontend-Installation, Playwright 1.62.1 und installiertes Chrome. Für die optionale Browserprüfung kann Playwright in einer getrennten QA-Umgebung installiert werden. `PLAYWRIGHT_MODULE` bezeichnet deren Modulpfad; ohne diese Variable wird ein normal erreichbares `playwright`-Modul geladen. `CHROME_PATH` kann einen vorhandenen Chrome-Pfad setzen; ansonsten wird unter Windows der übliche Chrome-Pfad verwendet, andernfalls Playwrights Browser. `APP_URL` überschreibt die lokale Adresse.

```sh
# Erst im Frontend den Entwicklungsserver starten
npm run web -- --port 8091
# In einem zweiten Terminal mit erreichbarer Playwright-Installation
node tests/browser/checks.cjs
```

Screenshots und `results.json` entstehen lokal unter `frontend/test-results/browser` und sind von Git ausgeschlossen. Die am 25.11.2026 um 14:42 Uhr Schweizer Zeit ausgeführte Wiederholung bestand beide Prüfgruppen „integrated app“ und „controlled save failures“ nach Übernahme der Kalenderänderungen bis 1b66cb8. Die damals geprüften zusätzlichen Änderungen am Vorlagendialog und den Browserprüfungen lagen im Testbranch.

## Reproduzierbare Fälle

| Fall | Vorbereitung und Schritte | Erwartung | Nachweis |
| --- | --- | --- | --- |
| A01 Suche und Details | Unbekannten Übungsnamen suchen, Filter zurücksetzen, Bankdrücken suchen und Details öffnen | Richtige Treffer; Anleitung sichtbar | Erster Browserdurchlauf und Katalogtests bestanden |
| A02 Editor und Validierung | Pull-Day-Vorlage am Montag einplanen; Latziehen auf 0 Sätze setzen, speichern; auf 5 Sätze und 0 kg korrigieren | 0 Sätze abgelehnt; korrigierte Werte nach erneutem Öffnen erhalten | Integrierte Browserprüfung bestanden |
| A03 Zuordnungen | Latziehen verschieben, Kabelrudern entfernen, Dead Bug hinzufügen und speichern | Richtige Reihenfolge; keine doppelte Zuordnung | Browserprüfung und Logiktests bestanden |
| A04 Verwerfen | 5 Sätze auf 6 ändern; schliessen, verwerfen und erneut öffnen | Zuvor gespeicherte 5 Sätze unverändert | Integrierte Browserprüfung bestanden |
| A05 Speicherfehler | Prüfaufbau lehnt ersten Speicheraufruf ab; zweiten Versuch ausführen | 7 Sätze bleiben im offenen Dialog; erneuter Versuch erfolgreich | Kontrollierter Fehlerdurchlauf bestanden |
| A06 Vorlage und Ersetzen | Belegten Tag wählen; 24:00 prüfen; gültige Zeit eingeben; Ersetzen zuerst abbrechen, dann bestätigen | Zeitprüfung; Abbruch erhält alten Inhalt; Bestätigung nötig | Kontrollierter Fehlerdurchlauf bestanden |
| A07 Vorlagenkopie | Übungen und Muskelgruppen einer übernommenen Kopie ändern | Originalvorlage unverändert | Logiktest mit unabhängigen Objekten bestanden |
| A08 Ernährung | xxxxx suchen; zurücksetzen; TRACKING mit Leerzeichen suchen, Details öffnen, Hydration filtern | 0/4, 4/4, 1/4 und 0/4 entsprechend Suche und Kategorie | Integrierte Browserprüfung bestanden |

## Noch ausstehende Gesamtprüfung

UC-01 Kalender/Wochenübersicht und UC-02/UC-05 Planung und Status haben zusätzliche Logiktests aus Arions Paket. Deren vollständige Bedienung und Bestätigungsdialoge auf Web und Gerät bleiben gesondert zu prüfen. UC-03/UC-04 Suche und Übungen, UC-06 Vorlagen und UC-08 Tipps sind durch die obigen Fälle abgedeckt. UC-07 Streak sowie die echte Persistenz jedes schreibenden Falls benötigen noch Systemnachweise. Der Kalender startet jetzt in der aktuellen Woche; frühere August-Demodaten erscheinen nur in ihrer jeweiligen Woche.

## Grenzen der Ergebnisse

Es wurden keine tatsächlichen Datenbank-Schreibvorgänge, keine Anmeldung über die App, kein echter Netzausfall, keine Neuinstallation und keine physischen Android-/iOS-Geräte in diesen Resultaten als bestanden gewertet. Ein Adaptertest verwendet eine nachgebildete HTTP-Antwort und belegt keine Erreichbarkeit der externen ExerciseDB-Quelle. Die Gesamtprojektabnahme ist offen.

Vor der Freigabe sind dauerhafte Speicherung nach App-Neustart, vollständiges verlustfreies Speichern aller Trainingsfelder, Benutzertrennung mit zwei Konten, abgelaufene Tokens, Kalendergrenzen, tatsächliche Geräte und Wiederherstellung aus einer Sicherung zu prüfen. Die historischen simulierten Protokolle in Arbeitsblatt 1 bleiben ausdrücklich Simulationen.

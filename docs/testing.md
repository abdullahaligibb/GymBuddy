# Tests und Nachweise

Stand 25.11.2026. Geprüft wurden Abdullahs Frontend-Funktionen im lokalen Entwicklungsstand einschliesslich der Ernährungstipps. Die Prüfungen liefen automatisiert; ein persönlicher Handtest aller vier Autoren wird damit nicht behauptet.

## Ausgeführte Prüfungen

- TypeScript-Prüfung ohne gemeldete Fehler.
- 13 automatisierte Logiktests, alle erfolgreich: vier Katalog-/API-Adaptertests, drei Editor-Tests, vier Vorlagentests und zwei Ernährungstests.
- Chrome im mobilen Browserformat 390 × 844: Übungssuche/Filter/Details, Editor-Eingabeprüfung, Hinzufügen/Entfernen/Sortieren, Speichern/erneut Öffnen und bewusstes Verwerfen erfolgreich.
- Separater Komponenten-Prüfaufbau: abgewiesenes Speichern im Editor und bei Vorlagen, erhaltene Eingaben und erfolgreicher erneuter Versuch geprüft. Der Fehler wurde durch eine absichtlich abgewiesene Speicherfunktion erzeugt; kein echter Serverausfall.
- Vorlagenübernahme in der tatsächlichen App: ungültige Uhrzeit, Ersetzungsbestätigung, Abbruch und übernommene Übungszuordnungen geprüft.
- Ernährungstipps: keine Treffer, Zurücksetzen, Suche mit Leerzeichen/Grossschreibung, kombinierte Kategorie und Detailanzeige geprüft.

In den erfolgreichen Browserdurchläufen wurden keine JavaScript-Seitenfehler erfasst. Während der Fehlerprüfung wurde ein Zurücksetzen der Vorlagenauswahl bei einer Eltern-Aktualisierung entdeckt, korrigiert und der Durchlauf erneut erfolgreich ausgeführt. Ein erster Prüfschritt erwartete irrtümlich Klimmzüge statt des in der Vorlage enthaltenen Latziehens; korrigiert wurde die Test-Erwartung.

## Wiederholung

Im Verzeichnis `frontend` die Befehle `npm run typecheck` und `npm test` ausführen. Die Testdateien liegen unter `frontend/tests`. Sie verwenden den eingebauten Node-Test-Runner und die vorhandene TypeScript-Installation. Der kleine Test-Lader übersetzt TypeScript für die Logiktests; die getrennte TypeScript-Prüfung bleibt deshalb zwingend.

Für die Browserprüfung mit `npm run web` starten und jeweils mit frisch geladenen Demo-Daten beginnen. Die reproduzierbaren Schritte und der ausführliche Prüfstand werden mit dem separaten Testpaket ergänzt.

## Grenzen der Ergebnisse

Es wurden keine tatsächlichen Datenbank-Schreibvorgänge, keine Anmeldung über die App, kein echter Netzausfall, keine Neuinstallation und keine physischen Android-/iOS-Geräte in diesen Resultaten als bestanden gewertet. Ein Adaptertest verwendet eine nachgebildete HTTP-Antwort und belegt keine Erreichbarkeit der externen ExerciseDB-Quelle. Die Gesamtprojektabnahme ist offen.

Vor der Freigabe sind dauerhafte Speicherung nach App-Neustart, vollständiges verlustfreies Speichern aller Trainingsfelder, Benutzertrennung mit zwei Konten, abgelaufene Tokens, Kalendergrenzen, tatsächliche Geräte und Wiederherstellung aus einer Sicherung zu prüfen. Die historischen simulierten Protokolle in Arbeitsblatt 1 bleiben ausdrücklich Simulationen.

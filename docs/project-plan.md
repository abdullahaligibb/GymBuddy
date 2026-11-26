# Aktueller Nachtrag – 26.11.2026

Die zuvor offenen Server-Schreibwege sind umgesetzt. Getrennte Pakete:
`feature/persistent-training` (615523b), `feature/profile-plans-macros` (4b2457b)
und `feature/server-connection` (Client, lokale Einrichtung und Gesamtprüfung).
Die ersten beiden Pakete wurden nach erfolgreichen echten PostgreSQL-Tests konfliktfrei
in main zusammengeführt. Das dritte Paket enthält die bestandene Gesamtprüfung und wird ebenfalls separat zusammengeführt.

Damit sind atomare vollständige Trainingsspeicherung, Kontentrennung, Pläne, Profil,
Makros, API-/DB-Neustart und Wiederherstellung technisch nachgewiesen. Zwei physische
Smartphones, unabhängige Bedienprüfung, Geräte-Leistungsmessung und fachliche Abnahme
bleiben offen. Arbeitsjournale und persönliche Stunden sind in diesem Nachtrag unverändert.
Loris' ältere Beiträge werden nicht rückwirkend um die hier neu implementierten Routen erweitert.
Die folgende frühere Arbeitsteilung bleibt als Planungsbasis erhalten; sie ist keine aktuelle
Liste fehlender Implementierungen oder alleiniger Urheberschaft.

---

# Projektplanung GymBuddy

Stand 25.11.2026. Autoren: Abdullah Ali, Gabriel Maurer, Arion Zeqaj und Loris Pérez, IM24A.

Dieser Fortschreibungsstand ergänzt die Konzeptplanung. Er trennt bereits umgesetzte Frontend-Funktionen, vorhandenen Backend-Code und noch ausstehende Integration. Die folgenden Zuständigkeiten sind die aktuelle Arbeitsteilung; sie beschreiben keine bereits von den Personen geleisteten Stunden.

## Aufgaben und selbständige Bearbeitung

| Person | Eigenständiges Arbeitspaket | Ohne Warten umsetzbar | Fertig wenn |
| --- | --- | --- | --- |
| Abdullah | Übungsbibliothek mit Suche, Muskel-, Geräte- und Schwierigkeitsfiltern, Details und Auswahl | Lokalen Katalog oder übergebene API-Daten verwenden | Such-, Filter-, Leer-, Fehler- und Auswahlfälle geprüft |
| Abdullah | Trainingsübungen hinzufügen, entfernen, sortieren; Sätze, Wiederholungen, Gewicht, Pausen und Notizen bearbeiten | Eigenen Entwurf und asynchrones `onSave` mit Testdaten verwenden | Ungültige Werte und unbekannte IDs blockiert; Verwerfen und Speicherfehler geprüft |
| Abdullah | Vorlagen anzeigen und unabhängig in Kalender kopieren | Tage und Vorlagen über Eigenschaften übergeben | Belegte Tage nur nach Bestätigung ersetzt; Kopie verändert Vorlage nicht |
| Abdullah | Ernährungstipps mit Kategorien, Suche und Details | Lokale Inhalte verwenden | Suche, Kategorien, Details und leere Ergebnisse geprüft |
| Abdullah | Architektur, Bedienung, Installation, Projektplan, Testdokumentation und Präsentationsablauf | Gegen dokumentierten Quellstand schreiben; offene Integration ausdrücklich benennen | Dokumentation stimmt mit Code und tatsächlichen Nachweisen überein |
| Arion | Kalender, Datumswechsel, Training/Ruhetag anlegen, ändern und löschen; Status und Formulare | Kalender-Daten und Speicherfunktionen als Testobjekte verwenden | Datumsgrenzen, ein Eintrag pro Datum, Bestätigungen und Fehlerfälle geprüft |
| Arion | Profil- und Körperdatenformulare | Formularwerte und `onSave` lokal prüfen | Pflichtfelder und Wertebereiche geprüft; Nutzereingaben bleiben bei Fehlern erhalten |
| Gabriel | Navigation, Registrierung, Login, Logout und Sitzungswiederherstellung | Bildschirme und Auth-Schnittstelle mit erfolgreicher/fehlerhafter Testantwort entwickeln | Geschützte Ansichten, abgelaufene Sitzung und erneutes Anmelden geprüft |
| Gabriel | Gemeinsamer API-Client, Tokenablage, Datenadapter, Laden und Speichern | Requests und Antworten mit Testdaten nachbilden | Keine Geheimnisse im Client; zentrale Fehlerbehandlung und tatsächliches erneutes Laden geprüft |
| Gabriel | Statistiken, Streak, Wochenziel und Makroberechnung/Tracking im Frontend | Reine Berechnungen und feste Datensätze verwenden | Datums-/Wochen-/Jahresgrenzen, Zielwerte und leere Daten geprüft |
| Loris | Auth-, Workout-, Übungs-, Profil-, Trainingsplan- und Makro-Backend; Datenmodell und Migrationen | Eigene API mit separater Testdatenbank entwickeln | Verträge und Validierung vollständig; fremde Nutzerdaten nicht zugreifbar |
| Loris | Übungszuordnungen vollständig ändern, entfernen und neu sortieren; Vorlagen atomar speichern | API-Verträge und Transaktionen unabhängig vom UI entwickeln | Keine halben Trainings bei Fehlern; Daten nach erneutem Abruf unverändert korrekt |
| Loris | Serverkonfiguration, Datenbankbetrieb, Sicherung/Wiederherstellung und Backendtests | Eigene Testumgebung und Beispieldaten verwenden | Neuinstallation und Wiederherstellung mit Nachweis geprüft |
| Alle | Zusammenführen, echte Geräte prüfen und Abnahme durchführen | Jeder bereitet seine Testfälle und Daten vor | Gesamter Ablauf mit zwei getrennten Konten und Neustart besteht |

Abdullahs vier Funktionspakete sind im Prototyp umgesetzt. Backend-Endpunkte für Registrierung, Login, Profilabruf, Katalog und grundlegende Workout-Aktionen sind im Repository vorhanden. Die weiteren Zeilen sind Fertigstellungskriterien, keine Erledigt-Meldungen.

## Meilensteine

| Stufe | Ergebnis und Freigabekriterium | Stand |
| --- | --- | --- |
| M1 Einzelpakete | Eigene Funktionen mit Testdaten und Fehlerfällen nutzbar | Abdullahs Funktionspakete geprüft |
| M2 Verträge | IDs, Wiederholungsformat, Ruhetag, Datum, Reihenfolge und Speicherantwort abgestimmt | Lücken in architecture.md festgehalten |
| M3 Integration | Anmeldung, Kalender und vollständiges Speichern/Laden ohne Datenverlust | Offen |
| M4 Systemtest | Zwei Konten, App-Neustart, Netzausfall und tatsächliche Geräte geprüft | Offen |
| M5 Einführung und Abschluss | Installation reproduzierbar, Abnahme und endgültige Berichte mit realen Resultaten | Offen |

Konkrete Schulabgaben werden gegen den aktuellen Unterrichtsplan bestätigt. Vier Lektionen pro Donnerstag sind kein Beleg für vier tatsächlich geleistete Lektionen an jedem Donnerstag; Ferien, Ausfälle und Einzelarbeit sind gesondert zu erfassen. Die früher verwendeten zufälligen Beispielwerte dürfen nicht als gemessene Ist-Zeit übernommen werden. Verlässliche Ist-Stunden liegen für diese Fortschreibung nicht vor.

## Aktualisierte Risiken und Massnahmen

| Risiko | Auswirkung | Massnahme und Zuständigkeit |
| --- | --- | --- |
| Frontend und API speichern unterschiedliche Felder | Wiederholungsbereiche, Pausen oder Notizen gehen verloren | Gabriel und Loris stimmen den Vertrag vor der Anbindung ab; Abdullah liefert validierte Entwürfe |
| Lokale und externe Übungs-IDs werden verwechselt | Falsche oder fehlende Zuordnung | Getrennte ID-Räume und explizite Zuordnung; unbekannte IDs nicht speichern |
| Mehrere Schreibaufrufe ersetzen einen Tag nur teilweise | Halbfertiges Training | Loris stellt atomare Speicherung bereit; UI bestätigt erst nach Erfolg |
| Fremde Kontodaten erreichbar | Verletzung der Benutzertrennung | Backend mit mindestens zwei Konten testen; zuständig Loris, Integration Gabriel |
| App-Neustart verliert Änderungen | Kernanforderung nicht erfüllt | Persistenztest als zwingendes Kriterium vor M4; Gabriel und Loris |
| Schulbericht meldet ungetestete Funktionen als fertig | Unzuverlässige Abgabe | Abdullah trennt Codeprüfung, Browsernachweis, Simulation und offene Abnahme |

## Nachweis der bisherigen Arbeit

Git-Autor, Commit und Änderungsinhalt gemeinsam betrachten. `MusicToGetCodedOn` wird Loris zugeordnet. Ein Merge belegt die Zusammenführung, nicht automatisch die alleinige Urheberschaft aller enthaltenen Dateien. Arbeitsstunden lassen sich aus Commit-Zeitpunkten nicht zuverlässig bestimmen.

Aktuelle Abdullah-Pakete: `feature/exercise-library`, `feature/workout-exercises`, `feature/workout-templates` und `feature/nutrition-tips`. Dokumentation und Testnachweise erhalten separate Branches. Jede Änderung wird vor der Zusammenführung geprüft.

| Person | Ausgewählte belegte Commits | Inhalt laut Verlauf |
| --- | --- | --- |
| Abdullah Ali | 1f060a1, 6e6469c, ea2616a, bd5b00f; d82cf1d, 788ece2, 9c86e69, 74a63b2 | Katalog, Suche und Details, Vorlagen; danach geprüfter Editor, Validierung und Ernährungstipps |
| Gabriel Maurer | c7f1044, 97330d6, 8a805c5 | Demo-Datenmodell, Statistikfunktionen und Dashboard-Anbindung |
| Arion Zeqaj | 72973b4, f580e26, dd6f4ad, 2d0b322; c7ca08a bis 1b66cb8 | Planungsdialog und Kalenderaktionen; danach dynamische Wochen, Profil-, Trainingsdetails und Planverwaltung sowie sechs Logiktests |
| Loris Pérez | 24d216a, 622ed88, 5ad209b, db8b67c, dceba7f, b80d8bf | Backend-Grundlage, externe Übungen, Authentifizierung und Workout-Endpunkte |

Diese Auswahl belegt vorhandene Änderungen, ist aber keine vollständige Leistungsbewertung der Teammitglieder. Sie ist aus `git log origin/main --no-merges` des aktuellen Stands abgeleitet.

# HTTP-Vertrag für die vollständige Frontend-Anbindung

Stand 26.11.2026. Der vollständige v1-Vertrag ist im Express-/Prisma-/PostgreSQL-Backend implementiert und gegen den tatsächlichen TypeScript-Client geprüft. `legacy` bleibt als ausdrückliche Option für ältere Server erhalten. Ohne Vertragsangabe verwendet eine konfigurierte Serveradresse v1.

## Transport und Fehler

Alle Inhalte sind JSON, ausgenommen 204-Antworten ohne Inhalt. Geschützte Aufrufe verwenden `Authorization: Bearer <token>`. Registrierung, Login und der öffentliche Katalog erhalten keinen gespeicherten Bearer-Token. Die Serveradresse enthält weder Zugangsdaten noch Query-Parameter. Standard-Zeitlimit sind 12 Sekunden. Fehlgeschlagene Aufrufe schreiben keine Demo-Daten und zeigen keinen Speichererfolg.

401 beendet die betroffene Sitzung. 403, 409, Serverausfälle und ungültige Antworten bleiben Fehler; Entwürfe bleiben erhalten. Fehlende optionale Leserouten werden als nicht verfügbare Funktion angezeigt. Der Workouts-Abruf ist verpflichtend: Ein Fehler dort wird nicht als leerer Trainingsbestand ausgegeben. Fehlerdetails eines Servers werden nicht ungefiltert angezeigt.

## Vorhandene Routen

| Methode und Pfad | Anfrage | Erfolgsantwort |
| --- | --- | --- |
| POST /api/auth/register | username, email, password | user und token |
| POST /api/auth/login | email, password | user und token |
| GET /api/auth/me | Bearer-Token | user |
| GET /api/exercises?limit=25 | öffentlich | exercises |
| GET /api/workouts | Bearer-Token | workouts einschliesslich eingebetteter Übungen |
| PATCH /api/workouts/:id/status | status GEPLANT, ERLEDIGT oder VERPASST | workout |
| DELETE /api/workouts/:id | Bearer-Token | 204 |

`user` enthält mindestens die Zeichenketten id, username und email. Workout-Antworten verwenden die bestehenden Datenbankfelder id, name, date, duration und status. Ungültige oder fehlende Kalenderdaten werden als fehlerhafte Antwort gemeldet. Der aktuelle v1-Server unterstützt RUHE und alle zusätzlichen Trainingsfelder. Der ältere legacy-Client aktiviert weiterhin nur den früheren Teilumfang.

## Vollständige implementierte Routen für v1

| Methode und Pfad | Anfrage | Erfolgsantwort |
| --- | --- | --- |
| POST /api/auth/logout | Bearer-Token | 204 |
| PUT /api/workouts/by-date/:date | vollständiges Training und geordnete exercises | workout |
| GET /api/plans | Bearer-Token | plans |
| PUT /api/plans/:id | vollständiger WorkoutPlan | plan |
| DELETE /api/plans/:id | Bearer-Token | 204 |
| GET /api/profile | Bearer-Token | profile oder null |
| PUT /api/profile | vollständiges HealthProfile | profile |
| GET /api/macros/target | Bearer-Token | target oder null |
| PUT /api/macros/target | calories, protein, carbs, fat | target |
| GET /api/macros/logs | Bearer-Token | logs |
| PUT /api/macros/logs/:date | dateIso und vollständige Makrowerte | log |
| DELETE /api/macros/logs/:date | Bearer-Token | 204 |

## Vollständiges Training

Das Kalenderdatum lautet YYYY-MM-DD, die Uhrzeit HH:mm; ein Ruhetag hat status RUHE und type Rest Day. Der schreibende Aufruf enthält name, date, duration, time, status, type, intensity, muscles, notes, sourceTemplateId, trainingPlanId und die vollständige geordnete Übungsliste.

Jede Zuordnung enthält catalogId, optional die bisherige Zuordnungs-id, optional externalId, position ab 1, sets, repetitions als Text, weight, restSeconds und notes. Wiederholungsbereiche und Zeitangaben bleiben als Text erhalten. 0 kg und 0 Sekunden sind gültige Werte; fehlende optionale Werte sind null. Die Zuordnungs-ID ist keine Katalog-ID. Die Anfrage enthält keine Benutzer-ID, die der Client frei wählen könnte.

Der Server bestimmt den Benutzer aus dem Token, prüft alle Referenzen und ersetzt den Eintrag für dieses Benutzer-Datum atomar. Neue Workouts erhalten ihre Datenbank-ID vom Server. Ein Fehler lässt das alte Training vollständig bestehen. Die Antwort enthält das gesamte gespeicherte Workout mit allen Werten und den geordneten Zuordnungen. Einmaligkeit je Benutzer und Datum ist serverseitig durchzusetzen.

Eingebettete exercise-Objekte enthalten mindestens name sowie die vorhandene externalId beziehungsweise catalogId. Beschreibung, Muskelgruppen und Geräte ergänzen die Anzeige. So bleiben gespeicherte Übungen auch dann identifizierbar, wenn sie nicht in der ersten externen Katalogseite enthalten sind. Lokale Vorlagen-IDs und externe API-IDs dürfen nicht über Namensvergleiche zusammengeführt werden.

## Pläne Profil und Makros

Pläne entsprechen `WorkoutPlan` aus `frontend/src/types.ts`, einschliesslich geordneter Übungen, Trainingsart, Intensität und Muskelgruppen. Profilfelder entsprechen `HealthProfile`: Geburtsdatum, Grösse, Gewicht, Zielgewicht, Zieldatum, Aktivität, Trainingsziel, Erfahrung, Wochenziel und bevorzugte Tage; die Berechnungsvariante ist optional. Ein noch nicht eingerichtetes Profil wird als null geliefert, nicht aus einem Alter zu einem erfundenen Geburtstag umgerechnet.

Makrowerte enthalten calories, protein, carbs und fat als nichtnegative ganze Zahlen. Tageswerte ergänzen dateIso. Erneutes Speichern ersetzt den vollständigen Eintrag des Benutzer-Datums. Alle Lese- und Schreiboperationen sind nach Benutzer zu trennen.

## Persistenz und Prüfung

Vollständige Trainings und Pläne werden atomar in PostgreSQL gespeichert. Profil und
Makros werden nach Benutzer getrennt upsertiert. Logout widerruft den konkreten Token
dauerhaft; die Middleware prüft Widerruf und vorhandenes Konto. Ein API-Neustart erhält
Daten und Tokenwiderruf. Acht echte Datenbankfälle sowie Live-App-Abläufe sind geprüft;
siehe testing.md. Physische Smartphones werden separat geprüft.

Der vollständige Schreibweg ist PUT, nicht die frühere Folge von Teil-POSTs.
Die alten POST-Teilrouten sind am aktuellen App-Einstieg nicht registriert. Bestehende
Clients müssen auf den vollständigen v1-Vertrag umgestellt werden.

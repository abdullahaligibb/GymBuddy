# Architektur – Stand 26.11.2026

Die Oberfläche verwendet React Native/Expo mit TypeScript. Fachregeln liegen in
`frontend/src/domain`, der austauschbare Datenvertrag in `src/services/api.ts`.
`configuredApi` aktiviert für eine Serveradresse standardmässig v1. Authentifizierte
Datenzugriffe verwenden den Bearer-Token; öffentliche Anmeldung und Katalog nicht.
Demo und Server besitzen getrennte Sitzungsschlüssel. Native Geräte verwenden
SecureStore, die Web-Sitzung bleibt im RAM und verlangt nach Browserneustart eine neue Anmeldung.

Express wird in `backend/src/app.js` aufgebaut. `server.js` startet den Listener.
Routen rufen getrennte Trainings- und Kontodatendienste auf. `lib/validation.js` prüft
Datumswerte, Typen, Grenzen und Übungsvorgaben. Ein gemeinsamer Prisma-Client verwendet
PostgreSQL. Die ursprünglichen Controller/Services für Teil-Workouts bleiben als älterer
Quellstand im Repository, sind aber nicht der vollständige aktuelle Schreibweg.

## Daten und Atomarität

Zehn Modelle: User, TrainingPlan, PlanExercise, Workout, WorkoutExercise, Exercise,
HealthProfile, MacroTarget, DailyMacroLog und RevokedToken. Pläne verwenden eine interne
ID und eine je Benutzer eindeutige Client-ID. Ein Workout verweist nur auf einen eigenen Plan.
Pro Benutzer/Datum besteht höchstens ein Workout beziehungsweise ein Makroprotokoll.

Vollständige Trainings und Pläne werden in serialisierbaren Transaktionen ersetzt:
Referenzen prüfen, Metadaten schreiben, alte Zuordnungen ersetzen, vollständiges
Ergebnis lesen und erst danach committen. Ein Fehler rollt alle Änderungen zurück.
Konkurrierende Konflikte liefern 409 statt halbfertiger Daten. Das Frontend zeigt
erst nach bestätigter Antwort den neuen Bestand und erhält bei Fehlern den Entwurf.

Textwiederholungen, Reihenfolge, Gewicht 0, Pause 0 und Notizen sind eigene Felder.
Lokale Katalog-IDs und externe `api:`-IDs bleiben getrennt. Der Backend-Katalog enthält
dieselben 24 lokalen Übungen wie der Client; der Integrationslauf vergleicht beide.
Externe, vom Anbieter geladene Metadaten werden serverseitig gespeichert. Bereits
gespeicherte Plan-/Trainingsübungen bleiben dadurch ausserhalb der ersten Katalogseite
identifizierbar. Der Client ergänzt seinen Katalog mit diesen eingebetteten Metadaten.

## Konten und Grenzen

bcrypt hasht Passwörter; JWTs sind signiert und sieben Tage gültig. Jede Anmeldung
erhält eine eigene Token-ID. Logout speichert den SHA-256-Fingerabdruck des konkreten
Tokens bis zum Ablauf und wird bei geschützten Anfragen geprüft. Ein gelöschtes Konto
wird ebenfalls abgewiesen. Geheimnisse werden weder im Frontend noch im Repository abgelegt.
Alle privaten Routen leiten den Benutzer aus dem geprüften Token ab.

Der lokale Stack ist ein Entwicklungsbetrieb mit LAN-HTTP und offenem Entwicklungs-CORS.
Ein öffentlicher Betrieb benötigt eine passende HTTPS-/CORS-/Hostkonfiguration.
Das ist kein ausgeführter Produktionstest bei einem externen Anbieter.

Die ursprüngliche lokale Offline-Muss-Architektur wurde nicht zusätzlich implementiert.
Der nun vollständige Serverbetrieb speichert dauerhaft, benötigt aber eine erreichbare
API. Der Streak zählt erfüllte Wochenziele. Beide fachlichen Änderungen bleiben gegenüber
dem ursprünglichen Konzept ausdrücklich zu entscheiden; eine Zustimmung wird nicht erfunden.

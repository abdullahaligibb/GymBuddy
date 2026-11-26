# GymBuddy

Fitness-App von LAAG, IM24A: Abdullah Ali, Gabriel Maurer, Arion Zeqaj und Loris Pérez.
React Native/Expo und TypeScript im Frontend; Express, Prisma und PostgreSQL im Backend.

## Stand 26.11.2026

Der vollständige Serververtrag ist implementiert: Anmeldung/Abmeldung, Trainings mit
geordneten Übungen, eigene Pläne, Profil, Makroziele und Tageswerte werden nach Benutzer
getrennt in PostgreSQL gespeichert. Wiederholungsbereiche, Zeitangaben, Nullwerte für
Gewicht/Pausen und Notizen bleiben erhalten. Ein Ruhetag ist ein eigener gespeicherter Eintrag.
Ein Serverfehler wechselt nicht unbemerkt auf Demo-Daten.

## Lokal mit echter Datenbank starten

Voraussetzungen: Node.js 24, npm und laufendes Docker Desktop mit Linux-Containern.
Im Projektverzeichnis:

```sh
npm run dev -- --host 192.168.x.x
```

Bei `--host` die eigene WLAN-IPv4-Adresse angeben. Ohne Angabe sucht der Starter eine
lokale IPv4-Adresse. Er erzeugt lokale Geheimnisse, startet PostgreSQL mit einem
dauerhaften Docker-Volume, installiert fehlende Abhängigkeiten, generiert Prisma,
wendet die Migrationen an und startet API (3000) und Expo (8091).
Handys im selben WLAN öffnen `http://<WLAN-IP>:8091`; alternativ den Expo-Go-Hinweisen folgen.
Mit Strg+C werden App und API beendet; die Datenbank und ihr Volume bleiben erhalten.
Nur die Einrichtung: `npm run setup -- --host 192.168.x.x`.

Vorhandene fremde Backend-Datenbankkonfigurationen werden nicht überschrieben.
Für einen bestehenden Server gilt die [manuelle Anleitung](docs/setup.md).
Die lokale Demo lässt sich weiterhin ausdrücklich über `EXPO_PUBLIC_API_MODE=demo` starten;
deren RAM-Daten sind nicht dauerhaft. Der Starter aktiviert dagegen den echten Servermodus v1.

## Geprüft

34 Frontend-Tests und TypeScript; 2 Backend-Validierungstests; 8 echte
PostgreSQL-Integrationsfälle einschliesslich API-/DB-Neustart, Rollback, zwei Konten,
vollständigem Frontend-Client und Wiederherstellung in eine separate Datenbank.
Sechs bisherige Browser-Prüfgruppen sowie vier Abläufe mit der echten App und Datenbank
bestanden. Physische Smartphones werden vom Team später getestet und sind noch offen.

## Dokumentation

- [Einrichtung und Betrieb](docs/setup.md)
- [Vollständiger HTTP-Vertrag](docs/api-contract.md)
- [Architektur](docs/architecture.md)
- [Testumfang, Resultate und Wiederholung](docs/testing.md)
- [Aufgaben und aktueller Projektstatus](docs/project-plan.md)
- [Ablauf für zwei echte Smartphones](docs/device-check.md)

Historische Schulunterlagen nennen ihren damaligen Quellstand. Die ursprüngliche
Offline-Architektur und die spätere Serverarchitektur sind unterschiedliche fachliche
Umfänge; die Änderung und die Wochenziel-Streak-Regel bleiben mit dem Auftraggeber abzustimmen.
Arbeitsjournale und persönliche Stunden wurden durch diese Umsetzung nicht verändert.

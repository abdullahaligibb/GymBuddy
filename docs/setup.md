# Einrichtung und Betrieb

Stand 26.11.2026. Geprüft mit Node 24.22.3, Prisma 6.12.0, PostgreSQL 16 und Chrome.

## Lokaler vollständiger Stack

Docker Desktop starten, Repository öffnen, `npm run dev -- --host <eigene WLAN-IPv4>` ausführen.
`npm run setup` richtet nur Datenbank, Dateien und Migrationen ein.
Die Einrichtung erzeugt `.env.local` im Projektstamm sowie `backend/.env` und
`frontend/.env`; alle sind von Git ausgeschlossen. Geheimnisse bleiben im Backend.
PostgreSQL wird ausschliesslich lokal auf Port 55433 gebunden, die API auf 3000,
Expo auf 8091. Das Compose-Volume `gymbuddy_data` erhält Daten über Neustarts hinweg.
Der Starter verwendet das Compose-Projekt `gymbuddy` und benötigt freie App-/API-Ports.

Wenn `backend/.env` bereits eine andere Datenbank enthält, bricht die lokale Einrichtung
ab und erhält diese Datei. Für diese Verbindung stattdessen die folgenden Schritte verwenden.

## Vorhandenes Backend / andere PostgreSQL-Instanz

1. Im Backend `npm ci` und `npx prisma generate` ausführen.
2. `backend/.env` mit `DATABASE_URL`, `DIRECT_URL`, einem eigenen zufälligen
   `JWT_SECRET` mit mindestens 32 Zeichen und optional `PORT=3000` einrichten.
3. Verbindungsziel und Sicherung prüfen, dann `npx prisma migrate deploy` ausführen.
   Mehrfach vorhandene Benutzer-Daten oder Übungspositionen müssen vor der neuen
   Migration fachlich bereinigt werden. Die Migration löscht diese Daten nicht still.
4. `npm start` im Backend. `GET /health` prüft den Prozess; eine Anmeldung und
   ein geschützter Abruf prüfen Datenbank und Tabellen.
5. Im Frontend `npm ci`; öffentliche `.env`:

```dotenv
EXPO_PUBLIC_API_MODE=server
EXPO_PUBLIC_API_URL=http://<erreichbare Serveradresse>:3000
EXPO_PUBLIC_API_CONTRACT=v1
```

6. Expo nach Konfigurationsänderungen neu starten: `npm run web -- --port 8091`
   oder `npm start` für Expo Go. Auf Handys steht localhost für das Handy selbst.
   Verwendet die LAN-Adresse des Rechners. Beide Geräte müssen diesen Rechner erreichen.

`legacy` bleibt als ausdrückliche Option für ältere Server vorhanden und kann keine
vollständigen Trainings, Pläne, Profile oder Makros speichern. Ohne Serveradresse
startet eine gekennzeichnete RAM-Demo; diese ist kein Persistenznachweis.

## Neustart, Sicherung und Fehler

Strg+C beendet die gestarteten App-/API-Prozesse. `npm run dev` startet sie erneut.
Ein gewöhnliches `docker compose --project-name gymbuddy --env-file .env.local stop`
behält das Volume. Das Volume nicht entfernen, solange dessen Daten gebraucht werden.
Quellcode in Git ersetzt keine Datensicherung.

Für PostgreSQL eine Sicherung mit `pg_dump --format=custom` erstellen und mit
`pg_restore --exit-on-error` in einer getrennten Datenbank prüfen. Der automatisierte
Recovery-Test beschreibt und prüft genau diesen Ablauf auf der separaten Testinstanz.
Sicherung, Zugang und Aufbewahrung für einen späteren externen Produktivbetrieb
müssen passend zum gewählten Host festgelegt werden.

401: erneut anmelden; 400: Eingaben prüfen; 409: neu laden und bewusst erneut speichern;
502 beim Katalog: mitgelieferte und bereits gespeicherte Übungen bleiben verfügbar.
Bei Speicherfehlern bleibt der Entwurf offen. Meldungen geben keine internen SQL-
oder Verbindungsdetails aus. Ein Serverausfall fällt nicht auf Demo-Daten zurück.

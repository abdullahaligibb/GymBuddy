# GymBuddy API

Node.js 24, Express und PostgreSQL über Prisma 6.12.0. Start: `npm ci`,
`npx prisma generate`, `npx prisma migrate deploy`, danach `npm start`.
Die Anwendung lädt ausschliesslich die lokale, nicht eingecheckte `.env`.

Benötigt: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (mindestens 32 Zeichen).
Ein eigenes Geheimnis erzeugen: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
`PORT` ist optional (3000), `HOST` standardmässig 0.0.0.0 für Gerätetests im selben LAN.
`APP_TIME_ZONE` ist standardmässig Europe/Zurich. Zugangsdaten gehören niemals ins Frontend.

## Migration bestehender Daten

Vor einer Migration die Datenbank sichern und das Verbindungsziel prüfen.
Die neue Migration erhält bestehende Datensätze und ergänzt Felder für vollständige
Trainingsdaten, persönliche Pläne, Profile und widerrufene Sitzungen. Numerische alte
Wiederholungen werden zusätzlich als Text übernommen. Bei mehrfach belegten
Benutzer-Daten oder Übungspositionen bricht die Migration ohne stilles Löschen ab.
Solche Altdaten müssen vor der Migration fachlich zugeordnet werden. Undatierte alte
Workouts benötigen ebenfalls ein echtes Kalenderdatum, bevor der mobile Client sie nutzen kann.

`GET /health` prüft den Prozess, nicht die Datenbank.
Anmeldung und ein geschützter Datenabruf prüfen den tatsächlichen Datenzugriff.
Abmeldung widerruft den konkreten Token dauerhaft; andere Sitzungen bleiben aktiv.

## Prüfungen

`npm test` prüft Eingabegrenzen, Ruhetage und ungültige Kalenderdaten.
Für `npm run test:integration` muss `TEST_DATABASE_URL` auf eine separate lokale
PostgreSQL-Datenbank mit einem Namen auf `_test` zeigen. Zuerst dort beide Prisma-
Verbindungsvariablen setzen und die Migrationen anwenden. Der Teststarter verweigert
andere Ziele und benötigt eine freie lokale API-Adresse. Er erstellt zufällige Testkonten
und entfernt ausschliesslich diese wieder.

Die Integrationstests starten echte API-Prozesse und prüfen Daten nach einem Prozess-
neustart, Rollback, konkurrierendes Speichern, Kontentrennung, Tokenwiderruf und
lokale/externe Katalog-IDs. Nur der externe Übungsanbieter wird durch einen lokalen
HTTP-Dienst ersetzt; Express, Prisma und PostgreSQL sind echt.

## Vollständiger Datenvertrag

`PUT /api/workouts/by-date/:date` ersetzt ein vollständiges Training atomar.
`GET /api/plans`, `PUT/DELETE /api/plans/:id`, `GET/PUT /api/profile`,
`GET/PUT /api/macros/target`, `GET /api/macros/logs` und
`PUT/DELETE /api/macros/logs/:date` verwenden dieselben Felder wie der Frontend-v1-Vertrag.
Plan-IDs des Clients sind je Benutzer eindeutig; Datenbank-IDs und fremde
Planreferenzen werden nicht als frei wählbare Benutzerzuordnung übernommen.
Das Löschen eines Plans erhält die bereits eingeplanten Trainings und setzt nur
deren Planreferenz auf null. Profil- und Makrodaten werden feldweise validiert;
ein erneutes Speichern eines Tages ersetzt dessen Werte vollständig.

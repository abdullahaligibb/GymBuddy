# Installation und Betrieb

Stand 25.11.2026. Die Frontend-Prüfungen wurden unter Windows mit bestehender Abhängigkeitsinstallation durchgeführt. Eine vollständige Neuinstallation mit Datenbank wurde in diesem Durchlauf nicht ausgeführt.

## Frontend

Voraussetzungen sind Git, Node.js mit npm und ein Browser; für Gerätetests zusätzlich die passende Expo-Umgebung. Eine konkrete Node-Version wird im Repository noch nicht festgeschrieben. Die Paketversionen ergeben sich aus den jeweiligen Lockdateien.

```sh
git clone https://github.com/abdullahaligibb/GymBuddy.git
cd GymBuddy/frontend
npm ci
npm run typecheck
npm test
npm run web
```

Den von Expo ausgegebenen lokalen Link öffnen. Für ein Handy im gleichen Netzwerk `npm start` verwenden. Ein freier Port kann mit `npm run web -- --port 8091` gewählt werden. Auf einem echten Gerät meint `localhost` das Gerät selbst; ein späterer API-Client benötigt die erreichbare Adresse des Entwicklungsrechners.

Prüfung: Übung suchen, Montag bearbeiten und danach neu öffnen. Ein Neuladen des Browsers stellt derzeit die Demo-Daten wieder her. Das ist die dokumentierte Grenze dieses Prototyps und noch kein bestandener Persistenztest.

## Backend in einer eigenen Testumgebung

Die folgenden Schritte richten sich an die verantwortliche Entwicklungsperson. Keine fremde oder produktive Datenbank verwenden. Die Zugangswerte werden separat bereitgestellt und nicht in Git gespeichert.

```sh
cd backend
npm ci
npx prisma generate
```

Eine lokale Datei `backend/.env` mit eigenen Werten anlegen:

```dotenv
PORT=3000
APP_NAME=GymBuddy API
NODE_ENV=development
DATABASE_URL=<Verbindungswert der eigenen PostgreSQL-Testdatenbank>
DIRECT_URL=<direkter Verbindungswert derselben Testdatenbank>
JWT_SECRET=<eigenes zufälliges Geheimnis>
```

Optional verwendet `EXERCISE_API_URL` eine andere kompatible Übungsquelle. Ohne diese Variable verwendet der vorhandene Service seine Standardadresse. Die genaue Pool-/Direkt-Verbindung wird von Loris passend zur Testdatenbank bereitgestellt; diese Anleitung erfindet keine Hostnamen oder Passwörter.

Vor der Migration Zielverbindung und vorhandene Migrationen prüfen. In einer freigegebenen Testumgebung:

```sh
npx prisma migrate deploy
npm start
```

Die Verbindung zur Datenbank und `/api/auth/me` mit einem gültigen Testkonto gesondert prüfen. `GET /health` auf Port 3000 meldet lediglich den laufenden HTTP-Dienst. Neue Schemaänderungen erhalten eigene geprüfte Migrationen; keinen Datenbank-Reset auf einer geteilten Instanz ausführen.

## Neustart und Fehlerbehandlung

Frontend und Backend laufen als getrennte Prozesse. Zum normalen Beenden im jeweiligen Terminal Strg+C verwenden und mit demselben Startbefehl erneut starten. Bei belegtem Port den zugehörigen eigenen Prozess beenden oder einen freien Entwicklungsport wählen. Server- und Expo-Ausgabe prüfen, ohne Passwörter, Bearer-Tokens oder vollständige Verbindungswerte zu veröffentlichen.

502 beim Katalog deutet auf eine fehlgeschlagene externe Quelle hin. 401 verlangt eine gültige Anmeldung. Bei Datenbankfehlern prüft Loris Erreichbarkeit, Zugang und angewendete Migrationen. Keine Meldung als erfolgreichen Speichervorgang ausgeben, solange die Daten nicht bestätigt wurden.

## Sicherung und Wiederherstellung

Die Sicherung des Quellcodes erfolgt über geprüfte Branches und das Remote-Repository. Git sichert keine Trainingsdaten. Ein Datenbank-Backup und eine Wiederherstellung in eine separate Testinstanz liegen in Loris' Betriebsaufgabe. Verfahren, Aufbewahrung und Wiederherstellungsnachweis sind vor der Einführung noch festzulegen. Ein automatisch funktionierendes Backup wird hier nicht behauptet.

# Testnachweise – 26.11.2026

## Ausgeführt

| Prüfung | Ergebnis | Aussage |
| --- | --- | --- |
| TypeScript (`npm run typecheck`) | bestanden | Client und Datenverträge kompilieren |
| Frontend (`npm test`) | 34/34 | Kalender, Formulare, Katalog, Pläne, Makros, HTTP-Client |
| Backend (`npm test`) | 2/2 | Typ-/Datumsgrenzen, Ruhetag, gemeinsame Dauer 1–600 |
| Echte PostgreSQL-Integration | 8/8 | vollständiger Client, Persistenz, Isolation, Fehler, Wiederherstellung |
| Bisherige Browsergruppen | 6/6 | Demo, Speicherfehler, Konten/Makros, Planeditor, Katalog, HTTP-Fixture |
| Live-App gegen echten Server | 4/4 Abläufe | echte Registrierung, alle Schreibfunktionen, geschlossener Browser und neues Login, zweites Konto |

Werkzeuge: Node 24.22.3, Prisma 6.12.0, PostgreSQL 16, Playwright/Chrome,
mobiler Browserbereich 390 × 844. Die bisherigen Browsergruppen verwenden eine feste
Uhr vom 25.11.; der Live-Durchlauf verwendet den 26.11.2026. Das Ausführungsdatum ist 26.11.2026.

## Acht Datenbankfälle

1. Training einschliesslich Textwiederholungen, Nullgewichten/-pausen und Notizen
   speichern; echten API-Prozess beenden; neu starten, neu anmelden und identisch lesen.
2. Ungültige Ersetzung erhält das alte Training; Reihenfolge ändern; parallele
   Schreibversuche ergeben ein vollständiges Training oder 409 und nur einen Tageseintrag.
3. Fremde IDs können nicht gelesen, geändert oder gelöscht werden; Ruhetage, Zukunft,
   ungültige Werte und nach Neustart weiterhin widerrufene Logout-Token prüfen.
4. Externe und lokale Katalog-IDs bleiben nach Speicherung getrennt. Der externe
   Anbieter ist für diesen Fall ein HTTP-Fixture; die Datenbank ist echt.
5. Eigene Pläne, Profil, Ziele und Tageswerte bleiben nach API-Neustart erhalten.
   Zwei Konten mit derselben Client-Plan-ID beeinflussen einander nicht. Fremde
   Planreferenzen und ungültige Ersetzungen werden abgewiesen.
6. Den tatsächlichen TypeScript-Client laden und alle Methoden gegen Express/Prisma/
   PostgreSQL ausführen; nach neuer Anmeldung und API-Neustart wieder lesen.
7. Einen echten Datenbankfehler während des Einfügens neuer Zuordnungen auslösen,
   nachdem alte Zuordnungen gelöscht wurden: die Transaktion stellt den vollständigen
   alten Datensatz wieder her und liefert keine internen SQL-Details an den Client.
8. `pg_dump` erstellen und mit `pg_restore` in eine andere Testdatenbank einspielen.
   Über einen neu gestarteten echten API-Prozess anmelden und vollständige Daten lesen.
   Auch den PostgreSQL-Container neu starten und den ursprünglichen Bestand vergleichen.

## Wiederholen

Frontend: `npm run typecheck`, `npm test`. Backend: `npm test`.
Für die echte Integration eine eigene lokale PostgreSQL-Datenbank mit einem Namen auf
`_test` verwenden. Zuerst `DATABASE_URL` und `DIRECT_URL` auf diese Instanz setzen und
`npx prisma migrate deploy` ausführen. Danach `TEST_DATABASE_URL` auf dieselbe Verbindung
setzen und `npm run test:integration` im Backend. Andere oder entfernte Testziele werden
abgewiesen. Der vollständige Clientfall benötigt installierte Frontend-Abhängigkeiten.

Für den achten Fall zusätzlich `TEST_POSTGRES_CONTAINER` auf den zugehörigen isolierten
Docker-Container setzen. Ohne diese Angabe ist genau dieser Fall übersprungen. Der Test
erstellt eine separate Restore-Datenbank und entfernt sie danach. Keine Entwicklungs-
oder produktive Instanz als Testziel verwenden. Testkonten werden zufällig benannt und
gezielt entfernt; bestehende fremde Konten werden nicht gelöscht.

Browser: Playwright bereitstellen (`PLAYWRIGHT_MODULE` für externe Installation,
`CHROME_PATH` optional) und Expo auf 8091 starten. Im Demo-Modus
`node tests/browser/checks.cjs` im Frontend ausführen. Für den vollständigen lokalen
Stack `npm run dev` starten und `node tests/browser/live-server.cjs` im Frontend ausführen.
Dieser zweite Lauf verlangt die eigene lokale `gymbuddy_dev`-Datenbank, verwendet den
unveränderten App-Einstieg ohne HTTP-Fixture und entfernt nur seine eigenen Testkonten.
Screenshots und JSON-Ergebnisse liegen unter `frontend/test-results/browser` und bleiben lokal.

## Noch offen

Zwei physische Smartphones: vom Team auf später verschoben; siehe [Geräteablauf](device-check.md).
Lasttest mit 365 Trainingstagen auf einem echten Gerät, unabhängige Bedienprüfung,
fachliche Abnahme und Freigabe der geänderten Offline-/Streak-Anforderungen bleiben offen.
Die Browser- und Datenbankergebnisse werden nicht als diese Freigaben ausgegeben.

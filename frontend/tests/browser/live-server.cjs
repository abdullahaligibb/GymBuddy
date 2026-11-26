/* Runs the unmodified app entry against the real local Express/PostgreSQL stack. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const base = process.env.APP_URL || 'http://localhost:8091';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error(
    'Run this destructive QA flow against the local development app only.',
  );
const out = path.resolve(__dirname, '../../test-results/browser');
fs.mkdirSync(out, { recursive: true });
const accounts = [];
const results = [];
const pages = [];
const backend = path.resolve(__dirname, '../../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({
  path: path.join(backend, '.env'),
  quiet: true,
});
const database = new URL(process.env.DATABASE_URL);
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  database.pathname !== '/gymbuddy_dev'
)
  throw new Error(
    'Live browser checks require the isolated local gymbuddy_dev database.',
  );
const { PrismaClient } = require(
  path.join(backend, 'node_modules/@prisma/client'),
);
const db = new PrismaClient();
const password = 'Browser-Test-2026!';
const button = (page, name) => page.getByRole('button', { name, exact: true });
async function login(page, account) {
  await page.getByLabel('E-Mail', { exact: true }).fill(account.email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await button(page, 'Anmelden').click();
  await page.getByText('Hallo ' + account.username, { exact: true }).waitFor();
}
async function register(page) {
  const id = randomUUID().slice(0, 8);
  const account = {
    username: 'browser-' + id,
    email: `browser-${id}@example.test`,
  };
  accounts.push(account);
  await button(page, 'Neues Konto erstellen').click();
  await page.getByLabel('Benutzername', { exact: true }).fill(account.username);
  await page.getByLabel('E-Mail', { exact: true }).fill(account.email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await button(page, 'Konto erstellen').click();
  await page.getByText('Hallo ' + account.username, { exact: true }).waitFor();
  return account;
}
async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  let page;
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    page = await context.newPage();
    pages.push(page);
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.setFixedTime(new Date(2026, 10, 26, 12));
    await page.goto(base);
    await page
      .getByText('Serverbetrieb', { exact: true })
      .waitFor({ timeout: 120000 });
    assert.equal(await button(page, 'Demo öffnen').count(), 0);
    const account = await register(page);
    await page.getByRole('tab', { name: 'Kalender', exact: true }).click();
    await button(page, 'Pull Day bearbeiten').click();
    const planName = 'DB Plan ' + account.username;
    await page.getByLabel('Planname', { exact: true }).fill(planName);
    await page.getByLabel('Latziehen: Sätze', { exact: true }).fill('5');
    await page
      .getByLabel('Latziehen: Gewicht in kg optional', { exact: true })
      .fill('0');
    await page
      .getByLabel('Latziehen: Pause in Sekunden optional', { exact: true })
      .fill('0');
    await button(page, 'Plan speichern').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await button(page, planName + ' auswählen').click();
    await page.getByRole('button', { name: /^Montag .* auswählen$/ }).click();
    await page.getByLabel('Uhrzeit für die Vorlage').fill('18:30');
    await button(page, 'Im Kalender einplanen').click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await button(page, 'Übungen für Montag bearbeiten').click();
    assert.equal(
      await page.getByLabel('Latziehen: Sätze', { exact: true }).inputValue(),
      '5',
    );
    await button(page, 'Schliessen').click();
    await page.getByRole('tab', { name: 'Ernährung', exact: true }).click();
    await page.getByLabel('Protein in Gramm').fill('100');
    await page.getByLabel('Kohlenhydrate in Gramm').fill('220');
    await page.getByLabel('Fett in Gramm').fill('50');
    await button(page, 'Tageswerte speichern').click();
    await page.getByText('1730 kcal', { exact: true }).waitFor();
    await button(page, 'Profil').click();
    await page.getByText('Profil einrichten', { exact: true }).click();
    for (const [label, value] of [
      ['Name *', 'QA Profil'],
      ['Geburtsdatum (JJJJ-MM-TT) *', '2005-01-01'],
      ['Grösse (cm) *', '180'],
      ['Gewicht (kg) *', '75'],
      ['Zielgewicht (kg) *', '80'],
      ['Zieldatum *', '2027-07-01'],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await button(page, 'Montag').click();
    await button(page, 'Männliche Formel').click();
    await page.getByText('Profil speichern', { exact: true }).click();
    await page
      .getByText('180 cm · 75 kg · Ziel 80 kg', { exact: true })
      .waitFor();
    await button(page, 'Zurück').click();
    await page.getByRole('tab', { name: 'Ernährung', exact: true }).click();
    await button(page, 'Ziel berechnen und speichern').click();
    await button(page, 'Ziel aktualisieren').waitFor();
    await page.screenshot({ path: path.join(out, 'live-postgres-macros.png') });
    results.push(
      'registration, plan, workout, profile and macros saved through the real UI',
    );
    await context.close();
    const reopened = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    page = await reopened.newPage();
    pages.push(page);
    page.setDefaultTimeout(30000);
    await page.clock.setFixedTime(new Date(2026, 10, 26, 12));
    await page.goto(base);
    await button(page, 'Anmelden').waitFor();
    await login(page, account);
    await page.getByRole('tab', { name: 'Kalender', exact: true }).click();
    await button(page, planName + ' bearbeiten').waitFor();
    await button(page, 'Übungen für Montag bearbeiten').click();
    assert.equal(
      await page.getByLabel('Latziehen: Sätze', { exact: true }).inputValue(),
      '5',
    );
    assert.equal(
      await page
        .getByLabel('Latziehen: Gewicht in kg optional', { exact: true })
        .inputValue(),
      '0',
    );
    assert.equal(
      await page
        .getByLabel('Latziehen: Pause in Sekunden optional', { exact: true })
        .inputValue(),
      '0',
    );
    await button(page, 'Schliessen').click();
    await page.screenshot({
      path: path.join(out, 'live-postgres-calendar.png'),
    });
    await page.getByRole('tab', { name: 'Ernährung', exact: true }).click();
    await page.getByText('1730 kcal', { exact: true }).waitFor();
    await button(page, 'Ziel aktualisieren').waitFor();
    await button(page, 'Profil').click();
    await page
      .getByText('180 cm · 75 kg · Ziel 80 kg', { exact: true })
      .waitFor();
    await button(page, 'Abmelden').click();
    await button(page, 'Anmelden').waitFor();
    results.push(
      'all saved fields survived a closed browser context and a fresh login',
    );
    const second = await register(page);
    await page.getByRole('tab', { name: 'Kalender', exact: true }).click();
    assert.equal(await button(page, planName + ' bearbeiten').count(), 0);
    assert.equal(
      await button(page, 'Übungen für Montag bearbeiten').count(),
      0,
    );
    await page.getByRole('tab', { name: 'Ernährung', exact: true }).click();
    await page
      .getByText('Für diesen Tag gibt es noch keinen Eintrag.', { exact: true })
      .waitFor();
    results.push(
      'a second real account sees no private plan, training or macro log',
    );
    await page.getByRole('tab', { name: 'Kalender', exact: true }).click();
    await button(page, '+ Training').click();
    await page
      .getByRole('dialog')
      .getByText('Ruhetag', { exact: true })
      .click();
    await page.getByText('Ruhetag speichern', { exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const secondUser = await db.user.findUniqueOrThrow({
      where: { email: second.email },
    });
    const rest = await db.workout.findFirstOrThrow({
      where: { userId: secondUser.id },
    });
    assert.equal(rest.status, 'RUHE');
    assert.equal(rest.duration, 0);
    assert.deepEqual(rest.muscles, []);
    results.push(
      'the calendar rest-day form saves a valid persistent rest day',
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, 'live-results.json'),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          backend: 'Express/Prisma/PostgreSQL, local gymbuddy_dev',
          results,
          physicalDevices: false,
        },
        null,
        2,
      ),
    );
    console.log(results.map((x) => 'PASS ' + x).join('\n'));
  } catch (error) {
    if (page && !page.isClosed()) {
      await page.screenshot({ path: path.join(out, 'live-failure.png') });
      fs.writeFileSync(
        path.join(out, 'live-failure.txt'),
        await page.locator('body').innerText(),
      );
    }
    throw error;
  } finally {
    await browser.close();
    if (accounts.length)
      await db.user.deleteMany({
        where: { email: { in: accounts.map((x) => x.email) } },
      });
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

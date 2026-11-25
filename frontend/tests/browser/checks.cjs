/* Optional browser checks. Install Playwright in a separate QA environment or set PLAYWRIGHT_MODULE. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.APP_URL || 'http://localhost:8091';
const output = path.resolve(__dirname, '../../test-results/browser');

async function appChecks(page) {
  await page.clock.setFixedTime(new Date(2026, 10, 25, 12));
  await page.goto(base);
  assert.equal(await page.getByRole('tab', { name: 'Kalender' }).count(), 0);
  await page.getByRole('button', { name: 'Demo öffnen' }).click({ timeout: 120000 });
  await page.getByRole('tab', { name: 'Ernährung' }).click();
  const nutrition = page.getByRole('textbox', {name:'Ernährungstipps suchen'});
  await nutrition.waitFor({timeout:120000});
  await nutrition.fill('xxxxx'); await page.getByText(/Kein Ernährungstipp gefunden/).waitFor();
  await page.getByRole('button',{name:'Ernährungsfilter zurücksetzen',exact:true}).click();
  await nutrition.fill('  TRACKING  '); await page.getByText('1 von 4 Tipps',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Leichter Kalorienüberschuss: Details anzeigen',exact:true}).click();
  await page.getByText(/Für sauberen Aufbau reicht/).waitFor();
  await page.getByRole('button',{name:'Ernährungskategorie Hydration',exact:true}).click();
  await page.getByText('0 von 4 Tipps',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Ernährungsfilter zurücksetzen',exact:true}).click();
  await page.getByText('4 von 4 Tipps',{exact:true}).waitFor();

  await page.getByRole('tab', { name: 'Kalender' }).click();
  const plan = page.getByText('Pull Day',{exact:true}).locator('..');
  await plan.getByText('Auswählen',{exact:true}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('1. Latziehen · 4 × 8-12',{exact:true}).waitFor();
  await page.getByRole('button',{name:/^Montag .* auswählen$/}).click();
  await page.getByRole('textbox',{name:'Uhrzeit für die Vorlage'}).fill('20:15');
  await page.getByRole('button',{name:'Im Kalender einplanen',exact:true}).click();
  await page.getByRole('button',{name:'Vorhandenes Training jetzt ersetzen',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Übungen für Montag bearbeiten',exact:true}).click();
  await page.getByRole('textbox',{name:'Latziehen: Sätze',exact:true}).fill('0');
  await page.getByRole('button',{name:'Übungen speichern',exact:true}).click();
  await page.getByText('Sätze: ganze Zahl von 1 bis 100 eingeben.',{exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Latziehen: Sätze',exact:true}).fill('5');
  await page.getByRole('textbox',{name:'Latziehen: Gewicht in kg optional',exact:true}).fill('0');
  await page.getByRole('button',{name:'Latziehen nach unten',exact:true}).click();
  await page.getByRole('button',{name:'Kabelrudern entfernen',exact:true}).click();
  await dialog.getByPlaceholder('Übung suchen …').fill('Dead Bug');
  await page.getByRole('button',{name:'Dead Bug zum Training hinzufügen',exact:true}).click();
  await page.getByRole('button',{name:'Dead Bug zum Training hinzufügen',exact:true}).isDisabled().then(disabled=>assert.equal(disabled,true));
  await page.getByRole('button',{name:'Übungen speichern',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Übungen für Montag bearbeiten',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Latziehen: Sätze',exact:true}).inputValue(),'5');
  assert.equal(await page.getByRole('textbox',{name:'Latziehen: Gewicht in kg optional',exact:true}).inputValue(),'0');
  await page.getByRole('textbox',{name:'Dead Bug: Sätze',exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Latziehen: Sätze',exact:true}).fill('6');
  await page.getByRole('button',{name:'Schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Verwerfen',exact:true}).click();
  await page.getByRole('button',{name:'Übungen für Montag bearbeiten',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Latziehen: Sätze',exact:true}).inputValue(),'5');
  await page.getByRole('dialog').evaluate(async()=>{
    await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));
  });
  await page.screenshot({path:path.join(output,'integrated-editor.png')});
}

async function planChecks(page) {
  await page.goto(base);
  await page.getByRole('button',{name:'Demo öffnen',exact:true}).click({timeout:120000});
  await page.getByRole('tab',{name:'Kalender',exact:true}).click();
  await page.getByRole('button',{name:'Pull Day bearbeiten',exact:true}).click();
  await page.getByLabel('Plandauer in Minuten',{exact:true}).fill('601');
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  await page.getByText('Vorlagendauer muss zwischen 1 und 600 Minuten liegen.',{exact:true}).waitFor();
  await page.getByLabel('Plandauer in Minuten',{exact:true}).fill('60');
  await page.getByLabel('Latziehen: Sätze',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  await page.getByText('Sätze: ganze Zahl von 1 bis 100 eingeben.',{exact:true}).waitFor();
  await page.getByLabel('Latziehen: Sätze',{exact:true}).fill('5');
  await page.getByLabel('Latziehen: Gewicht in kg optional',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Kabelrudern nach oben',exact:true}).click();
  await page.getByRole('button',{name:'Face Pulls entfernen',exact:true}).click();
  await page.getByRole('dialog').getByPlaceholder('Übung suchen …').fill('Dead Bug');
  await page.getByRole('button',{name:'Dead Bug zum Training hinzufügen',exact:true}).click();
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Pull Day bearbeiten',exact:true}).click();
  await page.getByText('1. Kabelrudern',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Latziehen: Sätze',{exact:true}).inputValue(),'5');
  assert.equal(await page.getByLabel('Latziehen: Gewicht in kg optional',{exact:true}).inputValue(),'0');
  await page.getByLabel('Dead Bug: Sätze',{exact:true}).waitFor();
  await page.getByLabel('Planname',{exact:true}).fill('Verwerfen');
  await page.getByRole('button',{name:'Schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Planänderungen verwerfen',exact:true}).click();
  await page.getByRole('button',{name:'Pull Day bearbeiten',exact:true}).click();
  assert.equal(await page.getByLabel('Planname',{exact:true}).inputValue(),'Pull Day');
  await page.getByLabel('Planname',{exact:true}).scrollIntoViewIfNeeded();
  await page.getByRole('dialog').evaluate(async()=>{ await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))); });
  await page.screenshot({path:path.join(output,'plan-editor.png')});
}

async function accountChecks(page) {
  await page.goto(base);
  const exact = (name) => page.getByRole('button', { name, exact: true });
  const nutrition = () => page.getByRole('tab', { name: 'Ernährung', exact: true }).click();
  const register = async (name) => {
    await exact('Neues Konto erstellen').click();
    await page.getByLabel('Benutzername', { exact: true }).fill(name);
    await page.getByLabel('E-Mail', { exact: true }).fill(`${name.toLowerCase()}@example.test`);
    await page.getByLabel('Passwort', { exact: true }).fill('Test1234!');
    await exact('Konto erstellen').click();
    await page.getByText(`Hallo ${name}`, { exact: true }).waitFor();
  };
  const logout = async () => {
    await exact('Profil').click();
    await exact('Abmelden').click();
    await exact('Anmelden').waitFor();
  };

  await exact('Anmelden').click();
  await page.getByText('Gültige E-Mail-Adresse eingeben.', { exact: true }).waitFor();
  await register('Alpha');
  await nutrition();
  await page.getByLabel('Protein in Gramm').fill('100');
  await page.getByLabel('Kohlenhydrate in Gramm').fill('220');
  await page.getByLabel('Fett in Gramm').fill('50');
  await exact('Tageswerte speichern').click();
  await page.getByText('1730 kcal', { exact: true }).waitFor();
  await page.getByLabel('Protein in Gramm').fill('110');
  await exact('Tageswerte speichern').click();
  await page.getByText('1770 kcal', { exact: true }).waitFor();
  await logout();
  await register('Bravo');
  await nutrition();
  await page.getByText('Für diesen Tag gibt es noch keinen Eintrag.', { exact: true }).waitFor();
  await page.reload();
  await exact('Anmelden').waitFor();
  assert.equal(await page.getByRole('tab', { name: 'Ernährung' }).count(), 0);
}

async function failureChecks(page) {
  await page.route('**/qa-check',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script src="/tests/browser/harness.bundle?platform=web&dev=true&hot=false"></script></html>'}));
  await page.goto(`${base}/qa-check`);
  await page.getByRole('button',{name:'Editor öffnen',exact:true}).click();
  await page.getByRole('textbox',{name:'Bankdrücken: Sätze',exact:true}).fill('7');
  await page.getByRole('button',{name:'Übungen speichern',exact:true}).click();
  await page.getByText(/Die Übungen konnten nicht gespeichert werden/).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Bankdrücken: Sätze',exact:true}).inputValue(),'7');
  await page.getByRole('button',{name:'Übungen speichern',exact:true}).click();
  await page.getByText('Gespeichert: 7; Titel: Push Day',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Vorlage öffnen',exact:true}).click();
  await page.getByRole('textbox',{name:'Uhrzeit für die Vorlage'}).fill('24:00');
  await page.getByRole('button',{name:'Im Kalender einplanen',exact:true}).click();
  await page.getByText(/Uhrzeit im Format HH:mm/).waitFor();
  await page.getByRole('textbox',{name:'Uhrzeit für die Vorlage'}).fill('19:15');
  await page.getByRole('button',{name:'Im Kalender einplanen',exact:true}).click();
  await page.getByRole('button',{name:'Ersetzen abbrechen',exact:true}).click();
  await page.getByRole('button',{name:'Schließen',exact:true}).click();
  await page.getByText('Gespeichert: 7; Titel: Push Day',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Vorlage öffnen',exact:true}).click();
  await page.getByRole('button',{name:'Im Kalender einplanen',exact:true}).click();
  await page.getByRole('button',{name:'Vorhandenes Training jetzt ersetzen',exact:true}).click();
  await page.getByText(/Speichern fehlgeschlagen/).waitFor();
  await page.screenshot({path:path.join(output,'failed-save.png')});
  await page.getByRole('button',{name:'Vorhandenes Training jetzt ersetzen',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Push Day bearbeiten',exact:true}).click();
  await page.getByLabel('Planname',{exact:true}).fill('Plan nach Fehler');
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  await page.getByText('Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Planname',{exact:true}).inputValue(),'Plan nach Fehler');
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Plan nach Fehler bearbeiten',exact:true}).waitFor();
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const chrome = process.env.CHROME_PATH || (process.platform==='win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  const browser = await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
  const results=[];
  try {
    for (const [name,check] of [['integrated app',appChecks],['controlled save failures',failureChecks],['accounts and macro tracking',accountChecks],['complete plan editor',planChecks]]) {
      if (process.env.CHECK_GROUP && process.env.CHECK_GROUP !== name) continue;
      const page = await browser.newPage({viewport:{width:390,height:844}});
      page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try {await check(page);assert.deepEqual(errors,[]);results.push({name,status:'passed'});console.log(`PASS ${name}`);}
      catch(error){await page.screenshot({path:path.join(output,'failure.png')});results.push({name,status:'failed',error:error.message,pageErrors:errors});throw error;}
      finally{await page.close();}
    }
  }finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({date:new Date().toISOString(),viewport:'390x844',results},null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

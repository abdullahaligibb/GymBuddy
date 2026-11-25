const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateMacroTarget, parseMacroLog } = require('../src/domain/macros.ts');

test('example adult profile gives reproducible maintenance targets', () => {
  const profile = {
    birthDateIso: '1996-03-10', heightCm: 180, weightKg: 80, energyFormula: 'male',
    activityLevel: 'Moderat aktiv', primaryGoal: 'Allgemeine Fitness',
  };
  const date = new Date(2026, 2, 10);
  assert.deepEqual(calculateMacroTarget(profile, date), { calories: 2761, protein: 128, carbs: 389, fat: 77 });
  assert.equal(calculateMacroTarget({ ...profile, energyFormula: undefined }, date), null);
  assert.equal(calculateMacroTarget({ ...profile, birthDateIso: '2008-03-11' }, date), null);
  assert.equal(calculateMacroTarget({ ...profile, birthDateIso: '1996-02-30' }, date), null);
});

test('daily energy comes from grams and rejects future dates and invalid data', () => {
  const date = new Date(2026, 2, 10);
  const draft = { protein: '100', carbs: '220', fat: '50' };
  assert.deepEqual(parseMacroLog('2026-03-10', draft, date),
    { calories: 1730, protein: 100, carbs: 220, fat: 50, dateIso: '2026-03-10' });
  assert.equal(parseMacroLog('2026-03-11', draft, date), null);
  assert.equal(parseMacroLog('2026-03-10', { ...draft, fat: '-5' }, date), null);
  assert.equal(parseMacroLog('2026-03-10', { ...draft, protein: '' }, date), null);
});

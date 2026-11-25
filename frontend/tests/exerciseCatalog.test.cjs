const { test } = require('node:test');
const assert = require('node:assert/strict');
const { exercises } = require('../src/data/exercises.ts');
const { filterExercises, EMPTY_EXERCISE_FILTERS, exerciseFilterOptions } = require('../src/domain/exerciseCatalog.ts');
const { mapApiExercise, mapExerciseCatalogResponse, fetchExerciseCatalog } = require('../src/services/exerciseCatalogApi.ts');
test('search ignores case and whitespace and combines all filters', () => {
  const hits = filterExercises(exercises, { search: ' BANKDRÜCKEN ', muscle: 'Brust', equipment: 'Langhantel', difficulty: 'Mittel' });
  assert.deepEqual(hits.map((x) => x.id), ['bankdruecken']);
  assert.equal(filterExercises(exercises, { ...EMPTY_EXERCISE_FILTERS, search: 'nicht-vorhanden' }).length, 0);
  assert.equal(filterExercises(exercises, EMPTY_EXERCISE_FILTERS).length, exercises.length);
});
test('unknown API metadata stays unknown; external IDs do not collide with local IDs', () => {
  const item = mapApiExercise({ id: 'bankdruecken', name: 'Press', targetMuscles: ['pectorals', 'delts'], equipments: ['barbell'], beschreibung: 'Instructions' });
  assert.equal(item.id, 'api:bankdruecken'); assert.equal(item.externalId, 'bankdruecken');
  assert.equal(item.muscle, 'Brust'); assert.equal(item.equipment, 'Langhantel');
  assert.equal(item.level, 'Nicht angegeben'); assert.equal(item.recommendedSets, undefined);
  assert.equal(filterExercises([item], { ...EMPTY_EXERCISE_FILTERS, muscle: 'delts' }).length, 1);
  assert.ok(exerciseFilterOptions([item]).muscles.includes('delts'));
  const unknown = mapApiExercise({ id: 'x', name: 'Unknown', targetMuscles: ['other'], equipments: [] });
  assert.equal(unknown.muscle, 'Unbekannt'); assert.equal(unknown.equipment, 'Unbekannt');
});
test('malformed catalog fails explicitly and repeated external IDs are deduplicated', () => {
  assert.throws(() => mapExerciseCatalogResponse({ data: [] }));
  assert.throws(() => mapExerciseCatalogResponse({ exercises: [{ name: 'No ID' }] }));
  assert.equal(mapExerciseCatalogResponse({ exercises: [{ id: '1', name: 'A' }, { id: '1', name: 'A' }] }).length, 1);
});
test('API adapter encodes the request, forwards cancellation and handles failure', async () => {
  const signal = new AbortController().signal;
  const items = await fetchExerciseCatalog('http://localhost:3000/', { name: 'bank & press', after: 'cursor', signal }, async (url, options) => {
    const parsed = new URL(url); assert.equal(parsed.pathname, '/api/exercises'); assert.equal(parsed.searchParams.get('name'), 'bank & press'); assert.equal(parsed.searchParams.get('after'), 'cursor'); assert.equal(options.signal, signal);
    return { ok: true, json: async () => ({ exercises: [{ id: '1', name: 'Press' }] }) };
  });
  assert.equal(items.length, 1);
  await assert.rejects(() => fetchExerciseCatalog('https://example.test', {}, async () => ({ ok: false })));
  await assert.rejects(() => fetchExerciseCatalog('https://example.test', {}, async () => { throw new Error('offline'); }));
});

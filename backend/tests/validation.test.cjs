const { test } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/lib/validation');
const row = {
  name: 'Push',
  date: '2026-11-23',
  duration: 45,
  time: '18:30',
  status: 'GEPLANT',
  type: 'Push',
  intensity: 'Mittel',
  muscles: ['Brust'],
  exercises: [
    {
      catalogId: 'bankdruecken',
      position: 1,
      sets: 3,
      repetitions: '8–12',
      weight: 0,
      restSeconds: 0,
      notes: 'kontrolliert',
    },
  ],
};
test('training validates all boundaries and preserves text repetitions and zero values', () => {
  for (const duration of [1, 45, 600])
    assert.equal(v.workout({ ...row, duration }, row.date).duration, duration);
  for (const duration of [0, 601, 1.5, '45', null])
    assert.throws(() => v.workout({ ...row, duration }, row.date), {
      statusCode: 400,
    });
  assert.equal(v.workout(row, row.date).exercises[0].weight, 0);
  for (const data of [
    null,
    [],
    { ...row, date: '2026-02-30' },
    { ...row, muscles: ['hacked'] },
    { ...row, status: 'OTHER' },
    { ...row, exercises: [...row.exercises, ...row.exercises] },
  ])
    assert.throws(() => v.workout(data, row.date), { statusCode: 400 });
});
test('rest days and future status rules match the calendar', () => {
  const rest = {
    ...row,
    duration: 0,
    status: 'RUHE',
    type: 'Rest Day',
    muscles: [],
    exercises: [],
    time: null,
  };
  assert.equal(v.workout(rest, row.date).status, 'RUHE');
  assert.throws(
    () => v.workout({ ...rest, exercises: row.exercises }, row.date),
    { statusCode: 400 },
  );
  assert.throws(
    () =>
      v.workout(
        { ...row, date: '2199-01-01', status: 'ERLEDIGT' },
        '2199-01-01',
      ),
    { statusCode: 400 },
  );
  for (const date of ['2026-02-29', '2026-13-01', '2026-01-32'])
    assert.throws(() => v.date(date), { statusCode: 400 });
});

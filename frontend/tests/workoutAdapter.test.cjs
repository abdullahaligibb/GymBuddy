const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fromWorkoutDto, toWorkoutDto } = require('../src/services/workoutAdapter.ts');

test('maps database workouts, local dates, exercise IDs, and repetition ranges', () => {
  const workout = fromWorkoutDto({
    id: 'db', name: 'Zugtraining', date: '2024-02-29', duration: 50, time: '18:30',
    status: 'ERLEDIGT', exercises: [
      { id: 'b', exerciseId: '2', position: 2, sets: 3, reps: 10 },
      { id: 'a', exerciseId: '1', position: 1, sets: 4, repetitions: '6-10', exercise: { externalId: 'lat' } },
    ],
  });
  assert.equal(workout.fullDay, 'Donnerstag');
  assert.equal(workout.exercises[0].exerciseId, 'api:lat');
  assert.equal(workout.exercises[0].associationId, 'a');
  assert.equal(workout.exercises[0].repetitions, '6-10');
  assert.equal(workout.exercises[1].repetitions, '10');
  assert.equal(toWorkoutDto(workout).status, 'ERLEDIGT');
  assert.equal(fromWorkoutDto({ date: '2025-02-29', status: 'GEPLANT' }), undefined);
});

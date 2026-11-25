const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateWorkoutDraft } = require('../src/domain/workoutForm.ts');
const { removeWorkout, upsertWorkout } = require('../src/domain/workoutState.ts');

const valid = { dateIso:'2026-11-24', title:'Push Day', time:'18:30', duration:'60', type:'Push', muscles:['Brust'], intensity:'Mittel', status:'geplant', notes:'' };
test('workout form accepts valid data and explains invalid values', () => {
  assert.deepEqual(validateWorkoutDraft(valid, new Date(2026, 10, 25)), {});
  const errors = validateWorkoutDraft({...valid,title:'',time:'25:80',duration:'2',muscles:[]}, new Date(2026, 10, 25));
  assert.ok(errors.title); assert.ok(errors.time); assert.ok(errors.duration); assert.ok(errors.muscles);
});
test('future workouts cannot be completed or missed', () => {
  const errors = validateWorkoutDraft({...valid,dateIso:'2026-11-26',status:'erledigt'}, new Date(2026, 10, 25));
  assert.ok(errors.status);
});
test('cancelled replace and delete actions leave local data unchanged', () => {
  const workout = {...valid,id:'one',day:'Mo',fullDay:'Montag',date:'24.11.',durationMinutes:60};
  const data = [workout];
  assert.equal(upsertWorkout(data, {...workout,title:'Neu'}, false), data);
  assert.equal(removeWorkout(data, workout.dateIso, false), data);
  assert.equal(removeWorkout(data, workout.dateIso, true).length, 0);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createWorkoutFromTemplate, isFreeCalendarDay, validateTemplate } = require('../src/domain/workoutTemplates.ts');
const { workoutTemplates } = require('../src/data/templates.ts');
const { initialWorkouts } = require('../src/data/workouts.ts');
const { exercises } = require('../src/data/exercises.ts');

test('all built-in templates reference valid exercises and prescriptions', () => {
  for (const template of workoutTemplates) assert.equal(validateTemplate(template, exercises), undefined, template.name);
});

test('adoption copies exercises and muscles independently while retaining calendar identity', () => {
  const template = structuredClone(workoutTemplates[0]);
  const day = structuredClone(initialWorkouts[0]);
  const before = structuredClone({ template, day });
  const copy = createWorkoutFromTemplate(template, day, ' 09:05 ', exercises);
  assert.equal(copy.id, day.id); assert.equal(copy.dateIso, day.dateIso);
  assert.equal(copy.time, '09:05'); assert.equal(copy.status, 'geplant');
  assert.equal(copy.sourceTemplateId, template.id);
  copy.exercises[0].sets = 99; copy.muscles.pop();
  assert.deepEqual({ template, day }, before);
});

test('invalid time, missing day, unknown exercise and duplicate exercise are rejected', () => {
  const template = workoutTemplates[0]; const day = initialWorkouts[0];
  for (const time of ['', '9:00', '24:00', '18:60', '18:00oops']) assert.throws(() => createWorkoutFromTemplate(template, day, time, exercises));
  assert.throws(() => createWorkoutFromTemplate(template, undefined, '18:00', exercises));
  for (const patch of [{exercises: []}, {durationMinutes:0}, {durationMinutes:1.5}, {name:' '}, {exercises:[{...template.exercises[0],exerciseId:'missing'}]}, {exercises:[template.exercises[0],template.exercises[0]]}]) {
    assert.throws(() => createWorkoutFromTemplate({...template,...patch}, day, '18:00', exercises));
  }
});

test('only an empty rest day is free; notes, existing exercises and planned rest are protected', () => {
  const free = {...initialWorkouts[0],status:'ruhe',type:'Rest Day',durationMinutes:0,muscles:[],exercises:[],notes:undefined,sourceTemplateId:undefined};
  assert.equal(isFreeCalendarDay(free), true);
  for (const patch of [{notes:'Mobility'}, {exercises:workoutTemplates[0].exercises}, {sourceTemplateId:'saved'}, {status:'geplant'}, {muscles:['Regeneration']}]) assert.equal(isFreeCalendarDay({...free,...patch}), false);
});

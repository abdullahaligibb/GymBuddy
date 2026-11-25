const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toPlanDraft, validatePlanDraft } = require('../src/domain/workoutPlans.ts');
const { moveExercise } = require('../src/domain/workoutExercises.ts');
const { validateTemplate } = require('../src/domain/workoutTemplates.ts');
const { workoutTemplates } = require('../src/data/templates.ts');
const { exercises } = require('../src/data/exercises.ts');

test('edited plans retain order, timed repetitions and zero weight without changing the source', () => {
  const source=structuredClone(workoutTemplates[0]);const before=structuredClone(source);
  const draft=toPlanDraft(source);draft.exercises=moveExercise(draft.exercises,1,-1).slice(0,2);
  draft.exercises[0]={...draft.exercises[0],sets:'5',weightKg:'0',repetitions:'30 Sek.'};
  const result=validatePlanDraft(draft,exercises);assert.ok(result.value);
  assert.equal(result.value.exercises[0].exerciseId,source.exercises[1].exerciseId);
  assert.equal(result.value.exercises[0].weightKg,0);assert.equal(result.value.exercises[0].sets,5);
  assert.equal(result.value.exercises[0].repetitions,'30 Sek.');assert.equal(result.value.exercises.length,2);
  assert.equal(validateTemplate(result.value,exercises),undefined);assert.deepEqual(source,before);
});
test('a saved plan must also satisfy all adoption rules',()=>{
  const draft=toPlanDraft(workoutTemplates[0]);
  for(const patch of [{name:'x'.repeat(61)},{goal:' '},{duration:'0'},{duration:'601'},{duration:'5abc'},{duration:'1.5'},{muscles:[]},{exercises:[]},{exercises:[{...draft.exercises[0],exerciseId:'missing'}]},{exercises:[{...draft.exercises[0],sets:'0'}]}]) {
    assert.equal(validatePlanDraft({...draft,...patch},exercises).value,undefined,JSON.stringify(patch));
  }
  for(const duration of ['1','600'])assert.ok(validatePlanDraft({...draft,duration},exercises).value);
});

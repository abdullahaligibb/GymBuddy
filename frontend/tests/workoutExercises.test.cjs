const { test } = require('node:test');const assert = require('node:assert/strict');
const { exercises } = require('../src/data/exercises.ts');
const { addExerciseDraft, moveExercise, toExerciseDraft, validateExerciseDrafts } = require('../src/domain/workoutExercises.ts');
const seed = () => addExerciseDraft([], exercises[0]);
test('adding prevents duplicates and moving does not mutate the source', () => {
 const a=seed();assert.throws(()=>addExerciseDraft(a,exercises[0]));const b=addExerciseDraft(a,exercises[1]);const moved=moveExercise(b,1,-1);assert.equal(moved[0].exerciseId,exercises[1].id);assert.equal(b[0].exerciseId,exercises[0].id);assert.deepEqual(moveExercise(b,0,-1),b);
});
test('ranges, timed repetitions, zero weight and optional values survive conversion', () => {
 const rows=[{...seed()[0],repetitions:'30–60 Sek.',weightKg:'0',restSeconds:'0',notes:' kontrolliert '}];
 const result=validateExerciseDrafts(rows,exercises);assert.deepEqual(result.errors,{});assert.equal(result.value[0].repetitions,'30–60 Sek.');assert.equal(result.value[0].weightKg,0);assert.equal(result.value[0].restSeconds,0);assert.equal(result.value[0].notes,'kontrolliert');assert.deepEqual(validateExerciseDrafts(result.value.map(toExerciseDraft),exercises).value,result.value);
 assert.equal(validateExerciseDrafts([{...rows[0],weightKg:'12,50'}],exercises).value[0].weightKg,12.5);
});
test('invalid and unknown exercises cannot be saved; an empty training is valid', () => {
 for(const patch of [{sets:'0'},{sets:'1.5'},{sets:'3abc'},{weightKg:'-1'},{weightKg:'Infinity'},{weightKg:'1.234'},{restSeconds:'-1'},{restSeconds:'3601'},{repetitions:' '},{notes:'x'.repeat(501)},{exerciseId:'missing'}])assert.equal(validateExerciseDrafts([{...seed()[0],...patch}],exercises).value,undefined,JSON.stringify(patch));
 assert.equal(validateExerciseDrafts([...seed(),...seed()],exercises).value,undefined);assert.deepEqual(validateExerciseDrafts([],exercises).value,[]);
});

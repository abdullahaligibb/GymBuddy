const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialHealthProfile } = require('../src/data/profile.ts');
const { validateHealthProfile } = require('../src/domain/profileForm.ts');

test('example health profile is valid and invalid units are rejected', () => {
  assert.deepEqual(validateHealthProfile(initialHealthProfile), {});
  const errors = validateHealthProfile({...initialHealthProfile,heightCm:20,weightKg:0,weeklyWorkoutGoal:9,preferredTrainingDays:[]});
  assert.ok(errors.heightCm); assert.ok(errors.weightKg); assert.ok(errors.weeklyWorkoutGoal); assert.ok(errors.preferredTrainingDays);
});

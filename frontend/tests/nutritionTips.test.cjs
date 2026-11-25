const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nutritionTips } = require('../src/data/nutritionTips.ts');
const { filterNutritionTips } = require('../src/domain/nutritionTips.ts');

test('nutrition search covers title, content and tags, trims whitespace and combines category',()=>{
  assert.equal(filterNutritionTips(nutritionTips,'  PROTEIN  ','Protein')[0].id,'protein-pro-mahlzeit');
  assert.equal(filterNutritionTips(nutritionTips,'mahlzeit','Protein').length,1);
  assert.equal(filterNutritionTips(nutritionTips,'Tracking','Kalorien').length,1);
  assert.equal(filterNutritionTips(nutritionTips,'Tracking','Hydration').length,0);
});
test('no matches, empty library and reset do not mutate nutrition content',()=>{
  const before=structuredClone(nutritionTips);
  assert.deepEqual(filterNutritionTips(nutritionTips,'unfindbar','Alle'),[]);
  assert.deepEqual(filterNutritionTips([],'','Alle'),[]);
  assert.deepEqual(filterNutritionTips(nutritionTips,'','Alle'),nutritionTips);
  assert.deepEqual(nutritionTips,before);
});

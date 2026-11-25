const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addDays, getWeekDays, isSameWeek, startOfWeek, toIsoDate } = require('../src/domain/calendar.ts');

test('calendar always builds Monday through Sunday across a year boundary', () => {
  const days = getWeekDays(new Date(2026, 11, 31), []);
  assert.deepEqual(days.map((day) => day.dateIso), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  assert.deepEqual(days.map((day) => day.day), ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
});

test('previous, next and today calculations retain correct calendar dates', () => {
  const anchor = new Date(2026, 0, 1);
  assert.equal(toIsoDate(startOfWeek(anchor)), '2025-12-29');
  assert.equal(toIsoDate(addDays(anchor, -7)), '2025-12-25');
  assert.equal(toIsoDate(addDays(anchor, 7)), '2026-01-08');
  assert.equal(isSameWeek(anchor, new Date(2026, 0, 4)), true);
  assert.equal(isSameWeek(anchor, new Date(2026, 0, 5)), false);
});

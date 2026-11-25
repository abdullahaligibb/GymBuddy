const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateWorkoutWeekStats } = require('../src/utils/workoutStats.ts');

function workout(dateIso, status, time = '18:00') {
  return { dateIso, status, time, durationMinutes: 50, type: 'Push' };
}

test('weekly totals cross year boundaries and the next workout can be next week', () => {
  const stats = calculateWorkoutWeekStats([
    workout('2025-12-29', 'erledigt'),
    workout('2026-01-02', 'geplant', '10:00'),
    workout('2026-01-05', 'geplant'),
  ], { weeklyWorkoutGoal: 2 }, 0, new Date(2026, 0, 2, 12));
  assert.equal(stats.completedWorkouts, 1);
  assert.equal(stats.trainingsThisWeek, 2);
  assert.equal(stats.totalTrainingTime, 50);
  assert.equal(stats.weeklyGoalPercent, 50);
  assert.equal(stats.nextWorkout.dateIso, '2026-01-05');
});

test('an unfinished week keeps the previous streak, a missing past week breaks it', () => {
  const entries = ['2026-01-05', '2026-01-08', '2026-01-12', '2026-01-16']
    .map((date) => workout(date, 'erledigt'));
  const goal = { weeklyWorkoutGoal: 2 };
  const current = calculateWorkoutWeekStats(entries, goal, 0, new Date(2026, 0, 21));
  assert.equal(current.currentStreak.currentWeeks, 2);
  const later = calculateWorkoutWeekStats(entries, goal, 0, new Date(2026, 0, 28));
  assert.equal(later.currentStreak.currentWeeks, 0);
  assert.equal(later.currentStreak.longestWeeks, 2);
});

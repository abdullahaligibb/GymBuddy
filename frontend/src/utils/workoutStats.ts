import { addDays, parseIsoDate, startOfWeek, toIsoDate } from "../domain/calendar";
import type { Streak, User, Workout } from "../types";

function isTraining(workout: Workout) {
  return workout.type !== "Rest Day" &&
    ["geplant", "erledigt", "verpasst"].includes(workout.status) &&
    Number.isFinite(workout.durationMinutes) && workout.durationMinutes > 0;
}

function workoutTime(workout: Workout) {
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(workout.time);
  if (!time) return NaN;
  const date = parseIsoDate(workout.dateIso);
  return date.setHours(Number(time[1]), Number(time[2]), 0, 0);
}

export function calculateCurrentStreak(
  workouts: Workout[],
  goal: number,
  previousRecord: number,
  today = new Date(),
): Streak {
  const todayIso = toIsoDate(today);
  const monday = startOfWeek(today);
  const mondayIso = toIsoDate(monday);
  const counts = new Map<string, Set<string>>();
  const past = workouts.filter(isTraining)
    .filter((item) => item.dateIso <= todayIso && ["erledigt", "verpasst"].includes(item.status))
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const consecutive = new Set<string>();
  let broken = false;
  for (const item of past) {
    if (item.status === "verpasst") broken = true;
    if (item.status !== "erledigt") continue;
    if (!broken) consecutive.add(item.dateIso);
    const week = toIsoDate(startOfWeek(parseIsoDate(item.dateIso)));
    const dates = counts.get(week) ?? new Set<string>();
    dates.add(item.dateIso);
    counts.set(week, dates);
  }

  const target = Number.isInteger(goal) && goal > 0 ? goal : Infinity;
  const qualified = [...counts].filter(([, dates]) => dates.size >= target)
    .map(([week]) => week).sort();
  const qualifiedWeeks = new Set(qualified);
  let cursor = qualifiedWeeks.has(mondayIso) ? monday : addDays(monday, -7);
  let currentWeeks = 0;
  while (qualifiedWeeks.has(toIsoDate(cursor))) {
    currentWeeks++;
    cursor = addDays(cursor, -7);
  }

  let longestWeeks = previousRecord;
  let run = 0;
  let previousDate: string | undefined;
  for (const week of qualified) {
    run = previousDate === toIsoDate(addDays(parseIsoDate(week), -7)) ? run + 1 : 1;
    longestWeeks = Math.max(longestWeeks, run);
    previousDate = week;
  }

  return {
    currentWeeks,
    currentTrainingDays: consecutive.size,
    longestWeeks,
    lastCompletedWorkoutDateIso: past.find((item) => item.status === "erledigt")?.dateIso,
  };
}

export function calculateWorkoutWeekStats(
  workouts: Workout[],
  user: Pick<User, "weeklyWorkoutGoal">,
  longestStreakWeeks: number,
  today = new Date(),
) {
  const monday = startOfWeek(today);
  const start = toIsoDate(monday);
  const end = toIsoDate(addDays(monday, 7));
  const todayIso = toIsoDate(today);
  const training = workouts.filter(isTraining);
  const thisWeek = training.filter((item) => item.dateIso >= start && item.dateIso < end);
  const done = thisWeek.filter((item) => item.status === "erledigt" && item.dateIso <= todayIso);
  const next = training.filter((item) => item.status === "geplant")
    .map((item) => ({ item, time: workoutTime(item) }))
    .filter(({ time }) => time >= today.getTime())
    .sort((a, b) => a.time - b.time)[0];

  return {
    trainingsThisWeek: thisWeek.length,
    completedWorkouts: done.length,
    totalTrainingTime: done.reduce((sum, workout) => sum + workout.durationMinutes, 0),
    weeklyGoalPercent: user.weeklyWorkoutGoal > 0
      ? Math.min(100, (done.length / user.weeklyWorkoutGoal) * 100)
      : 0,
    nextWorkout: next?.item,
    currentStreak: calculateCurrentStreak(workouts, user.weeklyWorkoutGoal, longestStreakWeeks, today),
  };
}

export function formatGermanDate(date: Date) {
  return new Intl.DateTimeFormat("de-CH", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
}

import { Streak, User, Workout } from "../types";

export type WorkoutWeekStats = {
  trainingsThisWeek: number;
  completedWorkouts: number;
  totalTrainingTime: number;
  weeklyGoalPercent: number;
  nextWorkout?: Workout;
  currentStreak: Streak;
};

function parseDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`);
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  return start;
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return end;
}

function isInRange(dateIso: string, start: Date, end: Date) {
  const date = parseDate(dateIso);

  return date >= start && date <= end;
}

function isTrainingWorkout(workout: Workout) {
  return workout.type !== "Rest Day" && workout.durationMinutes > 0;
}

function getWorkoutDateTime(workout: Workout) {
  const fallbackTime = workout.time === "-" ? "00:00" : workout.time;

  return new Date(`${workout.dateIso}T${fallbackTime}:00`);
}

export function calculateCurrentStreak(
  workouts: Workout[],
  weeklyWorkoutGoal: number,
  longestWeeks: number,
  today = new Date(),
): Streak {
  const todayStart = new Date(today);
  todayStart.setHours(23, 59, 59, 999);

  const pastTrainingWorkouts = workouts
    .filter((workout) => isTrainingWorkout(workout))
    .filter((workout) => parseDate(workout.dateIso) <= todayStart)
    .sort((first, second) => getWorkoutDateTime(second).getTime() - getWorkoutDateTime(first).getTime());

  let currentTrainingDays = 0;
  let lastCompletedWorkoutDateIso: string | undefined;

  for (const workout of pastTrainingWorkouts) {
    if (workout.status !== "erledigt") {
      break;
    }

    currentTrainingDays += 1;
    lastCompletedWorkoutDateIso = lastCompletedWorkoutDateIso ?? workout.dateIso;
  }

  return {
    currentTrainingDays,
    currentWeeks: Math.floor(currentTrainingDays / weeklyWorkoutGoal),
    longestWeeks,
    lastCompletedWorkoutDateIso,
  };
}

export function calculateWorkoutWeekStats(
  workouts: Workout[],
  user: User,
  longestStreakWeeks: number,
  today = new Date(),
): WorkoutWeekStats {
  const weekStart = getStartOfWeek(today);
  const weekEnd = getEndOfWeek(today);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const workoutsThisWeek = workouts.filter((workout) =>
    isInRange(workout.dateIso, weekStart, weekEnd),
  );
  const trainingWorkoutsThisWeek = workoutsThisWeek.filter(isTrainingWorkout);
  const completedWorkouts = trainingWorkoutsThisWeek.filter(
    (workout) => workout.status === "erledigt",
  );
  const nextWorkout = trainingWorkoutsThisWeek
    .filter((workout) => workout.status === "geplant")
    .filter((workout) => getWorkoutDateTime(workout) >= todayStart)
    .sort((first, second) => getWorkoutDateTime(first).getTime() - getWorkoutDateTime(second).getTime())[0];

  return {
    trainingsThisWeek: trainingWorkoutsThisWeek.length,
    completedWorkouts: completedWorkouts.length,
    totalTrainingTime: completedWorkouts.reduce(
      (sum, workout) => sum + workout.durationMinutes,
      0,
    ),
    weeklyGoalPercent: Math.min(
      (completedWorkouts.length / user.weeklyWorkoutGoal) * 100,
      100,
    ),
    nextWorkout,
    currentStreak: calculateCurrentStreak(
      workouts,
      user.weeklyWorkoutGoal,
      longestStreakWeeks,
      today,
    ),
  };
}

export function formatGermanDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
}

export function parseDemoDate(dateIso: string) {
  return parseDate(dateIso);
}

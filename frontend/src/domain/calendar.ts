import { WorkoutDay } from "../types";

const SHORT_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const FULL_DAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

export function parseIsoDate(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfWeek(date: Date) {
  const result = new Date(date);
  const weekday = result.getDay() === 0 ? 7 : result.getDay();
  result.setDate(result.getDate() - weekday + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function createEmptyWorkoutDay(date: Date): WorkoutDay {
  const dateIso = toIsoDate(date);
  return {
    id: `day-${dateIso}`,
    day: SHORT_DAYS[date.getDay()],
    fullDay: FULL_DAYS[date.getDay()],
    date: new Intl.DateTimeFormat("de-CH", {
      day: "2-digit",
      month: "2-digit",
    }).format(date),
    dateIso,
    title: "Noch nichts geplant",
    time: "-",
    durationMinutes: 0,
    type: "Rest Day",
    muscles: [],
    intensity: "Leicht",
    status: "ungeplant",
  };
}

export function getWeekDays(weekAnchor: Date, workouts: WorkoutDay[]) {
  const workoutByDate = new Map(workouts.map((workout) => [workout.dateIso, workout]));
  const monday = startOfWeek(weekAnchor);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    return workoutByDate.get(toIsoDate(date)) ?? createEmptyWorkoutDay(date);
  });
}

export function formatWeekRange(weekAnchor: Date) {
  const monday = startOfWeek(weekAnchor);
  const sunday = addDays(monday, 6);
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const start = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "short",
    year: sameYear ? undefined : "numeric",
  }).format(monday);
  const end = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(sunday);
  return `${start} – ${end}`;
}

export function isSameWeek(first: Date, second: Date) {
  return toIsoDate(startOfWeek(first)) === toIsoDate(startOfWeek(second));
}

export function isFutureDate(dateIso: string, today = new Date()) {
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  return parseIsoDate(dateIso) > endOfToday;
}

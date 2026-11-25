import { WorkoutDay } from "../types";

export function upsertWorkout(workouts: WorkoutDay[], workout: WorkoutDay, confirmed = true) {
  if (!confirmed) return workouts;
  return [...workouts.filter((item) => item.dateIso !== workout.dateIso), workout];
}

export function removeWorkout(workouts: WorkoutDay[], dateIso: string, confirmed = true) {
  if (!confirmed) return workouts;
  return workouts.filter((item) => item.dateIso !== dateIso);
}

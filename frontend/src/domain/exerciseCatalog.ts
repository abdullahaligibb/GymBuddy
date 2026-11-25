import type { Exercise } from "../types";

export const ALL_EXERCISES = "Alle";
export type ExerciseFilters = { search: string; muscle: string; equipment: string; difficulty: string };
export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = { search: "", muscle: ALL_EXERCISES, equipment: ALL_EXERCISES, difficulty: ALL_EXERCISES };
/** Keep local template references valid and never guess identity from an exercise name. */
export function mergeExerciseCatalogs(...catalogs: readonly (readonly Exercise[])[]): Exercise[] {
  return Array.from(new Map(catalogs.flatMap((catalog) => catalog.map((exercise) => [exercise.id, exercise] as const))).values());
}
const normalize = (value: string) => value.trim().toLocaleLowerCase("de-DE");

export function filterExercises(items: readonly Exercise[], filters: ExerciseFilters): Exercise[] {
  const search = normalize(filters.search);
  return items.filter((item) =>
    normalize(item.name).includes(search) &&
    (filters.muscle === ALL_EXERCISES || item.muscle === filters.muscle || item.targetMuscles?.includes(filters.muscle)) &&
    (filters.equipment === ALL_EXERCISES || item.equipment === filters.equipment || item.equipments?.includes(filters.equipment)) &&
    (filters.difficulty === ALL_EXERCISES || item.level === filters.difficulty),
  ).sort((a, b) => a.name.localeCompare(b.name, "de-DE") || a.id.localeCompare(b.id));
}

export function exerciseFilterOptions(items: readonly Exercise[]) {
  const unique = (values: string[]) => [ALL_EXERCISES, ...Array.from(new Set(values)).filter((v) => v !== ALL_EXERCISES).sort((a, b) => a.localeCompare(b, "de-DE"))];
  return {
    muscles: unique(items.flatMap((x) => [x.muscle, ...(x.targetMuscles ?? [])])),
    equipment: unique(items.flatMap((x) => [x.equipment, ...(x.equipments ?? [])])),
    difficulty: unique(items.map((x) => x.level)),
  };
}

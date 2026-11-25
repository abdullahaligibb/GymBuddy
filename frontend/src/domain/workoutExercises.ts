import type { Exercise, WorkoutExercise } from "../types";

export type ExerciseDraft = { exerciseId: string; sets: string; repetitions: string; weightKg: string; restSeconds: string; notes: string };
export function toExerciseDraft(item: WorkoutExercise): ExerciseDraft {
  return { exerciseId: item.exerciseId, sets: String(item.sets), repetitions: item.repetitions, weightKg: item.weightKg == null ? "" : String(item.weightKg), restSeconds: item.restSeconds == null ? "" : String(item.restSeconds), notes: item.notes ?? "" };
}
export function addExerciseDraft(items: readonly ExerciseDraft[], exercise: Exercise): ExerciseDraft[] {
  if (items.some((x) => x.exerciseId === exercise.id)) throw new Error("Diese Übung ist bereits im Training.");
  return [...items, { exerciseId: exercise.id, sets: String(exercise.recommendedSets ?? 3), repetitions: exercise.recommendedRepetitions ?? "8–12", weightKg: "", restSeconds: "", notes: "" }];
}
export function moveExercise<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const result = [...items]; const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return result;
  [result[index], result[target]] = [result[target], result[index]]; return result;
}
export function validateExerciseDrafts(drafts: readonly ExerciseDraft[], catalog: readonly Exercise[]): { value?: WorkoutExercise[]; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {}; const result: WorkoutExercise[] = []; const seen = new Set<string>(); const ids = new Set(catalog.map((x) => x.id));
  for (const row of drafts) {
    const messages: string[] = [];
    if (!ids.has(row.exerciseId)) messages.push("Übung fehlt im geladenen Katalog. Bitte Katalog laden oder Zuordnung entfernen.");
    if (seen.has(row.exerciseId)) messages.push("Diese Übung ist doppelt zugeordnet."); seen.add(row.exerciseId);
    if (!/^\d+$/.test(row.sets.trim()) || Number(row.sets) < 1 || Number(row.sets) > 100) messages.push("Sätze: ganze Zahl von 1 bis 100 eingeben.");
    const repetitions = row.repetitions.trim();
    if (!repetitions || repetitions.length > 50) messages.push("Wiederholungen: 1 bis 50 Zeichen eingeben, z. B. 8–12 oder 30 Sek.");
    const weightText = row.weightKg.trim().replace(",", ".");
    if (weightText && (!/^\d+(?:\.\d{1,2})?$/.test(weightText) || Number(weightText) > 1000)) messages.push("Gewicht: Zahl von 0 bis 1000 kg mit höchstens zwei Nachkommastellen eingeben.");
    const rest = row.restSeconds.trim();
    if (rest && (!/^\d+$/.test(rest) || Number(rest) > 3600)) messages.push("Pause: ganze Zahl von 0 bis 3600 Sekunden eingeben.");
    if (row.notes.trim().length > 500) messages.push("Notizen dürfen höchstens 500 Zeichen enthalten.");
    if (messages.length) errors[row.exerciseId] = [...(errors[row.exerciseId] ?? []), ...messages];
    result.push({ exerciseId: row.exerciseId, sets: Number(row.sets), repetitions, ...(weightText ? { weightKg: Number(weightText) } : {}), ...(rest ? { restSeconds: Number(rest) } : {}), ...(row.notes.trim() ? { notes: row.notes.trim() } : {}) });
  }
  return Object.keys(errors).length ? { errors } : { value: result, errors };
}

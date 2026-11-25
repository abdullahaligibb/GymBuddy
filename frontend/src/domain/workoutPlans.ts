import type { Exercise, WorkoutPlan } from "../types";
import { ExerciseDraft, toExerciseDraft, validateExerciseDrafts } from "./workoutExercises";
import { validateTemplate } from "./workoutTemplates";

export type PlanDraft = Omit<WorkoutPlan, "durationMinutes" | "exercises"> & { duration: string; exercises: ExerciseDraft[] };

export function toPlanDraft(plan: WorkoutPlan): PlanDraft {
  return { ...plan, muscles: [...plan.muscles], duration: String(plan.durationMinutes), exercises: plan.exercises.map(toExerciseDraft) };
}

export function validatePlanDraft(draft: PlanDraft, catalog: readonly Exercise[]): { value?: WorkoutPlan; message?: string; errors: Record<string, string[]> } {
  const checked = validateExerciseDrafts(draft.exercises, catalog);
  if (!checked.value) return { message: "Bitte die markierten Übungsvorgaben korrigieren.", errors: checked.errors };
  if (!/^\d+$/.test(draft.duration.trim())) return { message: "Dauer: ganze Zahl von 1 bis 600 Minuten eingeben.", errors: {} };
  const { duration, exercises: _, ...metadata } = draft;
  const value = { ...metadata, name: draft.name.trim(), goal: draft.goal.trim(), muscles: [...draft.muscles], durationMinutes: Number(duration), exercises: checked.value, isCustom: true };
  const message = validateTemplate(value, catalog);
  return message ? { message, errors: {} } : { value, errors: {} };
}

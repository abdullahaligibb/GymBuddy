import { WorkoutDay, WorkoutStatus } from "../types";
import { isFutureDate } from "./calendar";

export type WorkoutDraft = Pick<
  WorkoutDay,
  | "dateIso"
  | "title"
  | "time"
  | "type"
  | "muscles"
  | "intensity"
  | "status"
> & {
  duration: string;
  notes: string;
};

export type ValidationErrors = Partial<Record<keyof WorkoutDraft, string>>;

export function validateWorkoutDraft(
  draft: WorkoutDraft,
  today = new Date(),
): ValidationErrors {
  const errors: ValidationErrors = {};
  const duration = Number(draft.duration);

  if (!draft.title.trim()) errors.title = "Bitte einen Trainingstitel eingeben.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
    errors.time = "Bitte eine Uhrzeit im Format HH:MM eingeben.";
  }
  if (!Number.isInteger(duration) || duration < 5 || duration > 360) {
    errors.duration = "Die Dauer muss zwischen 5 und 360 Minuten liegen.";
  }
  if (draft.muscles.length === 0) {
    errors.muscles = "Bitte mindestens eine Muskelgruppe auswählen.";
  }
  if (
    isFutureDate(draft.dateIso, today) &&
    (draft.status === "erledigt" || draft.status === "verpasst")
  ) {
    errors.status = "Zukünftige Trainings können nur als geplant markiert werden.";
  }
  return errors;
}

export function validateRestDay(dateIso: string, status: WorkoutStatus) {
  return status === "ruhe" && Boolean(dateIso);
}

export function hasValidationErrors(errors: ValidationErrors) {
  return Object.keys(errors).length > 0;
}

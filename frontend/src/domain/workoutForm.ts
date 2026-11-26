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

  if (!draft.title.trim() || draft.title.trim().length > 60) errors.title = "Trainingstitel: 1 bis 60 Zeichen eingeben.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
    errors.time = "Bitte eine Uhrzeit im Format HH:MM eingeben.";
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
    errors.duration = "Die Dauer muss zwischen 1 und 600 Minuten liegen.";
  }
  if (draft.muscles.length === 0) {
    errors.muscles = "Bitte mindestens eine Muskelgruppe auswählen.";
  }
  if (draft.notes.trim().length > 2000) errors.notes = "Notizen dürfen höchstens 2000 Zeichen enthalten.";
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

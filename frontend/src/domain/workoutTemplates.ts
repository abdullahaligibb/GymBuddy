import type { Exercise, WorkoutDay, WorkoutTemplate } from "../types";
import { toExerciseDraft, validateExerciseDrafts } from "./workoutExercises";

export function isFreeCalendarDay(day: WorkoutDay): boolean {
  return (day.status === "ruhe" || day.status === "ungeplant") && day.type === "Rest Day" &&
    day.durationMinutes === 0 && day.muscles.length === 0 &&
    !day.exercises?.length && !day.sourceTemplateId && !day.notes?.trim();
}

export function validateTemplate(template: WorkoutTemplate, catalog: readonly Exercise[]): string | undefined {
  if (!template.name.trim() || template.name.trim().length > 60) {
    return "Vorlagenname muss 1 bis 60 Zeichen enthalten.";
  }
  if (!Number.isInteger(template.durationMinutes) || template.durationMinutes < 1 || template.durationMinutes > 600) {
    return "Vorlagendauer muss zwischen 1 und 600 Minuten liegen.";
  }
  if (!template.goal.trim() || template.goal.trim().length > 300) return "Ziel muss 1 bis 300 Zeichen enthalten.";
  if (!["Leicht", "Mittel", "Schwer"].includes(template.difficulty)) return "Bitte eine gültige Intensität wählen.";
  if (!["Push", "Pull", "Legs", "Full Body", "Upper Body", "Lower Body", "Cardio"].includes(template.type)) return "Bitte eine gültige Trainingsart wählen.";
  const allowedMuscles = ["Bauch", "Beine", "Bizeps", "Brust", "Ganzkörper", "Gesäß", "Rücken", "Schulter", "Trizeps", "Waden", "Cardio", "Regeneration"];
  if (!template.muscles.length || template.muscles.some((muscle) => !allowedMuscles.includes(muscle))) return "Bitte mindestens eine gültige Muskelgruppe wählen.";
  if (!template.exercises.length) return "Die Vorlage enthält keine Übungen.";
  const checked = validateExerciseDrafts(template.exercises.map(toExerciseDraft), catalog);
  if (!checked.value) return Object.values(checked.errors).flat().join(" ");
}

/** Always creates an independent copy; replacement confirmation belongs to the caller. */
export function createWorkoutFromTemplate(template: WorkoutTemplate, day: WorkoutDay | undefined, time: string, catalog: readonly Exercise[]): WorkoutDay {
  if (!day) throw new Error("Bitte einen verfügbaren Kalendertag wählen.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
    throw new Error("Uhrzeit im Format HH:mm eingeben, z. B. 18:00.");
  }
  const error = validateTemplate(template, catalog);
  if (error) throw new Error(error);
  return {
    ...day,
    title: template.name.trim(), time: time.trim(), durationMinutes: template.durationMinutes,
    type: template.type, muscles: [...template.muscles], intensity: template.difficulty,
    status: "geplant", notes: `Ziel: ${template.goal}`, sourceTemplateId: template.id,
    exercises: validateExerciseDrafts(template.exercises.map(toExerciseDraft), catalog).value!,
  };
}

import { createEmptyWorkoutDay, parseIsoDate, toIsoDate } from "../domain/calendar";
import type { Workout, WorkoutExercise } from "../types";

const statuses = {
  GEPLANT: "geplant", ERLEDIGT: "erledigt", VERPASST: "verpasst", RUHE: "ruhe",
} as const;

export type WorkoutDto = {
  id: string;
  name: string;
  date: string | null;
  duration: number | null;
  time?: string | null;
  status: keyof typeof statuses;
  type?: Workout["type"];
  intensity?: Workout["intensity"];
  muscles?: Workout["muscles"];
  notes?: string | null;
  sourceTemplateId?: string | null;
  trainingPlanId?: string | null;
  exercises?: {
    id?: string;
    exerciseId: string;
    position: number;
    sets: number | null;
    reps?: number | null;
    repetitions?: string | null;
    weight?: number | null;
    restSeconds?: number | null;
    notes?: string | null;
    exercise?: { externalId?: string | null; catalogId?: string | null };
  }[];
};

function mapExercise(row: NonNullable<WorkoutDto["exercises"]>[number]): WorkoutExercise {
  return {
    exerciseId: row.exercise?.catalogId ?? (row.exercise?.externalId
      ? `api:${row.exercise.externalId}` : row.exerciseId),
    associationId: row.id,
    sets: row.sets ?? 0,
    repetitions: row.repetitions ?? (row.reps == null ? "" : String(row.reps)),
    weightKg: row.weight ?? undefined,
    restSeconds: row.restSeconds ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function fromWorkoutDto(dto: WorkoutDto): Workout | undefined {
  if (!dto.date || !/^\d{4}-\d{2}-\d{2}$/.test(dto.date)) return;
  const date = parseIsoDate(dto.date);
  if (toIsoDate(date) !== dto.date || !statuses[dto.status]) return;
  return {
    ...createEmptyWorkoutDay(date),
    id: dto.id,
    title: dto.name,
    time: dto.time ?? "-",
    durationMinutes: dto.duration ?? 0,
    status: statuses[dto.status],
    type: dto.status === "RUHE" ? "Rest Day" : dto.type ?? "Full Body",
    intensity: dto.intensity ?? "Mittel",
    muscles: dto.muscles ?? [],
    notes: dto.notes ?? undefined,
    sourceTemplateId: dto.sourceTemplateId ?? undefined,
    trainingPlanId: dto.trainingPlanId ?? undefined,
    exercises: [...dto.exercises ?? []].sort((a, b) => a.position - b.position).map(mapExercise),
  };
}

export function toWorkoutDto(workout: Workout) {
  if (workout.status === "ungeplant") throw new Error("Ein freier Tag ist kein gespeicherter Eintrag.");
  return {
    name: workout.title,
    date: workout.dateIso,
    duration: workout.durationMinutes,
    time: workout.time === "-" ? null : workout.time,
    status: workout.status.toUpperCase(),
    type: workout.type,
    intensity: workout.intensity,
    muscles: workout.muscles,
    notes: workout.notes ?? null,
    sourceTemplateId: workout.sourceTemplateId ?? null,
    trainingPlanId: workout.trainingPlanId ?? null,
  };
}

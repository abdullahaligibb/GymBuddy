export type WorkoutStatus = "erledigt" | "geplant" | "verpasst" | "ruhe";

export type TrainingGoal =
  | "Muskelaufbau"
  | "Kraftaufbau"
  | "Fettabbau"
  | "Allgemeine Fitness";

export type ExperienceLevel = "Einsteiger" | "Mittel" | "Fortgeschritten";

export type WorkoutSplit =
  | "Push/Pull/Legs"
  | "Upper/Lower"
  | "Full Body"
  | "Individuell";

export type User = {
  id: string;
  name: string;
  goal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  weeklyWorkoutGoal: number;
  split: WorkoutSplit;
  preferredTrainingDays: string[];
};

export type WorkoutType =
  | "Push"
  | "Pull"
  | "Legs"
  | "Full Body"
  | "Upper Body"
  | "Lower Body"
  | "Cardio"
  | "Mobility"
  | "Rest Day";

export type WorkoutIntensity = "Leicht" | "Mittel" | "Schwer";

export type MuscleGroup =
  | "Bauch"
  | "Beine"
  | "Bizeps"
  | "Brust"
  | "Ganzkörper"
  | "Gesäß"
  | "Rücken"
  | "Schulter"
  | "Trizeps"
  | "Waden";

export type WorkoutFocus = MuscleGroup | "Cardio" | "Regeneration";

export type ExerciseEquipment =
  | "Eigengewicht"
  | "Kabelzug"
  | "Kettlebell"
  | "Kurzhanteln"
  | "Langhantel"
  | "Maschine";

export type ExerciseDifficulty = "Einsteiger" | "Mittel" | "Fortgeschritten";

export type Exercise = {
  id: string;
  externalId?: string;
  source?: "local" | "api";
  name: string;
  muscle: MuscleGroup | "Unbekannt";
  equipment: ExerciseEquipment | "Unbekannt";
  level: ExerciseDifficulty | "Nicht angegeben";
  targetMuscles?: string[];
  equipments?: string[];
  description: string;
  recommendedSets?: number;
  recommendedRepetitions?: string;
  commonMistake?: string;
  safetyNote?: string;
};

export type WorkoutExercise = {
  exerciseId: Exercise["id"];
  sets: number;
  repetitions: string;
  weightKg?: number;
  restSeconds?: number;
  notes?: string;
};

export type Workout = {
  id: string;
  day: string;
  fullDay: string;
  date: string;
  dateIso: string;
  title: string;
  time: string;
  durationMinutes: number;
  type: WorkoutType;
  muscles: WorkoutFocus[];
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  notes?: string;
  sourceTemplateId?: string;
  exercises?: WorkoutExercise[];
};

export type WorkoutDay = Workout;

export type WorkoutTemplate = {
  id: string;
  name: string;
  type: Exclude<WorkoutType, "Mobility" | "Rest Day">;
  durationMinutes: number;
  goal: string;
  difficulty: WorkoutIntensity;
  muscles: WorkoutFocus[];
  exercises: WorkoutExercise[];
};

export type Streak = {
  currentWeeks: number;
  currentTrainingDays: number;
  longestWeeks: number;
  lastCompletedWorkoutDateIso?: string;
};

export type NutritionTip = {
  id: string;
  title: string;
  category: "Protein" | "Kalorien" | "Timing" | "Regeneration" | "Hydration";
  body: string;
  tags: string[];
};

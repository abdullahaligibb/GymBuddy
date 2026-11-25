export type WorkoutStatus =
  | "erledigt"
  | "geplant"
  | "verpasst"
  | "ruhe"
  | "ungeplant";

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
  catalogEntry?: Exercise;
  exerciseId: Exercise["id"];
  associationId?: string;
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
  trainingPlanId?: string;
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

export type WorkoutPlan = WorkoutTemplate & {
  isCustom?: boolean;
  isActive?: boolean;
};

export type ActivityLevel =
  | "Wenig aktiv"
  | "Leicht aktiv"
  | "Moderat aktiv"
  | "Sehr aktiv";

export type HealthProfile = {
  name: string;
  birthDateIso: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  targetDateIso: string;
  activityLevel: ActivityLevel;
  primaryGoal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  weeklyWorkoutGoal: number;
  preferredTrainingDays: string[];
  energyFormula?: "female" | "male";
};

export type Account = { id: string; username: string; email: string };
export type Session = { user: Account; token: string };
export type Login = Pick<Account, "email"> & { password: string };
export type Registration = Login & Pick<Account, "username">;
export type MacroValues = { calories: number; protein: number; carbs: number; fat: number };
export type DailyMacroLog = MacroValues & { dateIso: string };

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

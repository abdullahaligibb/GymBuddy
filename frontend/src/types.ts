export type WorkoutStatus = "erledigt" | "geplant" | "verpasst" | "ruhe";

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

export type WorkoutDay = {
  id: string;
  day: string;
  fullDay: string;
  date: string;
  title: string;
  time: string;
  durationMinutes: number;
  type: WorkoutType;
  muscles: string[];
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  notes?: string;
};

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
  name: string;
  muscle: MuscleGroup;
  equipment: ExerciseEquipment;
  level: ExerciseDifficulty;
  description: string;
  recommendedSets: number;
  recommendedRepetitions: string;
  commonMistake: string;
  safetyNote: string;
};

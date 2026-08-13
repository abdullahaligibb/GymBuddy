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

export type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  level: string;
};

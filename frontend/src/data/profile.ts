import { HealthProfile, Streak, User } from "../types";

export const demoUser: User = {
  id: "user-arion",
  name: "Arion",
  goal: "Muskelaufbau",
  experienceLevel: "Fortgeschritten",
  weeklyWorkoutGoal: 3,
  split: "Push/Pull/Legs",
  preferredTrainingDays: ["Montag", "Mittwoch", "Freitag"],
};

export const demoTodayIso = "2026-08-27";

export const initialStreak: Streak = {
  currentWeeks: 0,
  currentTrainingDays: 0,
  longestWeeks: 4,
};

export const initialHealthProfile: HealthProfile = {
  name: "Arion",
  birthDateIso: "2008-04-16",
  heightCm: 178,
  weightKg: 61,
  targetWeightKg: 70,
  targetDateIso: "2027-06-30",
  activityLevel: "Moderat aktiv",
  primaryGoal: "Muskelaufbau",
  experienceLevel: "Fortgeschritten",
  weeklyWorkoutGoal: 3,
  preferredTrainingDays: ["Montag", "Mittwoch", "Freitag"],
};

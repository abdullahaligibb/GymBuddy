import { Streak, User } from "../types";

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

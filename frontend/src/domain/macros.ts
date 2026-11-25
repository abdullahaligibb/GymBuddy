import { parseIsoDate, toIsoDate } from "./calendar";
import type { ActivityLevel, DailyMacroLog, HealthProfile, MacroValues, TrainingGoal } from "../types";

const factors: Record<ActivityLevel, number> = {
  "Wenig aktiv": 1.2, "Leicht aktiv": 1.375, "Moderat aktiv": 1.55, "Sehr aktiv": 1.725,
};
const adjustments: Record<TrainingGoal, number> = {
  Muskelaufbau: 200, Kraftaufbau: 0, Fettabbau: -300, "Allgemeine Fitness": 0,
};

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toIsoDate(parseIsoDate(value)) === value;
}

function energy(protein: number, carbs: number, fat: number) {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function calculateMacroTarget(profile: HealthProfile | null, today = new Date()): MacroValues | null {
  if (!profile || !validDate(profile.birthDateIso) ||
    !["female", "male"].some((variant) => variant === profile.energyFormula) ||
    !Number.isFinite(profile.heightCm) || profile.heightCm < 100 || profile.heightCm > 250 ||
    !Number.isFinite(profile.weightKg) || profile.weightKg < 30 || profile.weightKg > 350) return null;
  const birth = parseIsoDate(profile.birthDateIso);
  const monthDay = toIsoDate(today).slice(5);
  const age = today.getFullYear() - birth.getFullYear() - Number(monthDay < profile.birthDateIso.slice(5));
  const activity = factors[profile.activityLevel];
  const adjustment = adjustments[profile.primaryGoal];
  if (age < 18 || age > 100 || !activity || !Number.isFinite(adjustment)) return null;

  const rest = 9.99 * profile.weightKg + 6.25 * profile.heightCm - 4.92 * age +
    (profile.energyFormula === "male" ? 5 : -161);
  const estimate = Math.round(rest * activity + adjustment);
  if (estimate < 1200) return null;
  const protein = Math.round(profile.weightKg * 1.6);
  const fat = Math.round(estimate * 0.25 / 9);
  const carbs = Math.round((estimate - energy(protein, 0, fat)) / 4);
  if (carbs < 0) return null;
  return { calories: energy(protein, carbs, fat), protein, carbs, fat };
}

export type MacroDraft = Record<"protein" | "carbs" | "fat", string>;

export function parseMacroLog(dateIso: string, draft: MacroDraft, today = new Date()): DailyMacroLog | null {
  if (!validDate(dateIso) || dateIso > toIsoDate(today)) return null;
  const values = [draft.protein, draft.carbs, draft.fat].map((input) =>
    /^\d{1,4}$/.test(input.trim()) ? Number(input) : NaN,
  );
  if (!values.every((value) => Number.isInteger(value) && value >= 0 && value <= 1000)) return null;
  const [protein, carbs, fat] = values;
  return { dateIso, calories: energy(protein, carbs, fat), protein, carbs, fat };
}

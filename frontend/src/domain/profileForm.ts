import { HealthProfile } from "../types";

export type ProfileErrors = Partial<Record<keyof HealthProfile, string>>;

export function validateHealthProfile(profile: HealthProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!profile.name.trim()) errors.name = "Name ist erforderlich.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDateIso)) {
    errors.birthDateIso = "Geburtsdatum im Format JJJJ-MM-TT eingeben.";
  }
  if (profile.heightCm < 100 || profile.heightCm > 250) {
    errors.heightCm = "Grösse muss zwischen 100 und 250 cm liegen.";
  }
  if (profile.weightKg < 30 || profile.weightKg > 350) {
    errors.weightKg = "Gewicht muss zwischen 30 und 350 kg liegen.";
  }
  if (profile.targetWeightKg < 30 || profile.targetWeightKg > 350) {
    errors.targetWeightKg = "Zielgewicht muss zwischen 30 und 350 kg liegen.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.targetDateIso)) {
    errors.targetDateIso = "Zieldatum im Format JJJJ-MM-TT eingeben.";
  }
  if (profile.weeklyWorkoutGoal < 1 || profile.weeklyWorkoutGoal > 7) {
    errors.weeklyWorkoutGoal = "Wochenziel muss zwischen 1 und 7 liegen.";
  }
  if (profile.preferredTrainingDays.length === 0) {
    errors.preferredTrainingDays = "Mindestens einen Trainingstag auswählen.";
  }
  return errors;
}

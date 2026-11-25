import type {
  Account, DailyMacroLog, Exercise, HealthProfile, Login, MacroValues,
  Registration, Session, Workout, WorkoutPlan, WorkoutStatus,
} from "../types";

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export type AppApi = {
  login(input: Login): Promise<Session>;
  register(input: Registration): Promise<Session>;
  me(token: string): Promise<Account>;
  logout(token: string): Promise<void>;
  listExercises(): Promise<Exercise[]>;
  listWorkouts(token: string): Promise<Workout[]>;
  saveWorkout(token: string, workout: Workout): Promise<Workout>;
  setStatus(token: string, workout: Workout, status: WorkoutStatus): Promise<Workout>;
  deleteWorkout(token: string, workout: Workout): Promise<void>;
  listPlans(token: string): Promise<WorkoutPlan[]>;
  savePlan(token: string, plan: WorkoutPlan): Promise<WorkoutPlan>;
  deletePlan(token: string, plan: WorkoutPlan): Promise<void>;
  getProfile(token: string): Promise<HealthProfile | null>;
  saveProfile(token: string, profile: HealthProfile): Promise<HealthProfile>;
  getMacroTarget(token: string): Promise<MacroValues | null>;
  saveMacroTarget(token: string, target: MacroValues): Promise<MacroValues>;
  listMacroLogs(token: string): Promise<DailyMacroLog[]>;
  saveMacroLog(token: string, log: DailyMacroLog): Promise<DailyMacroLog>;
  deleteMacroLog(token: string, dateIso: string): Promise<void>;
};

export function validateLogin(input: Login) {
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ? "" : "Gültige E-Mail-Adresse eingeben.",
    password: input.password.length >= 8 ? "" : "Mindestens 8 Zeichen eingeben.",
  };
}

export function validateRegistration(input: Registration) {
  return { ...validateLogin(input),
    username: /^.{2,40}$/.test(input.username.trim()) ? "" : "Name muss 2 bis 40 Zeichen haben.",
  };
}

export function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Verbindung fehlgeschlagen. Bitte erneut versuchen.";
}

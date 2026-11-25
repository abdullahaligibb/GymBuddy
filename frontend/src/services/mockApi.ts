import { exercises } from "../data/exercises";
import { initialHealthProfile } from "../data/profile";
import { workoutTemplates } from "../data/templates";
import { initialWorkouts } from "../data/workouts";
import { addDays, createEmptyWorkoutDay, startOfWeek, toIsoDate } from "../domain/calendar";
import { ApiError, validateRegistration } from "./api";
import type { AppApi } from "./api";
import type { Account, DailyMacroLog, HealthProfile, MacroValues, Workout, WorkoutPlan } from "../types";

export const demoLogin = { email: "demo@gymbuddy.local", password: "GymBuddyDemo" };
const demoToken = "gymbuddy-demo-session-v1";
type AccountData = {
  workouts: Workout[];
  plans: WorkoutPlan[];
  profile: HealthProfile | null;
  target: MacroValues | null;
  logs: DailyMacroLog[];
};

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMockApi(options: {
  now?: () => Date;
  before?: (method: keyof AppApi) => void | Promise<void>;
} = {}): AppApi {
  const now = options.now ?? (() => new Date());
  const demo = { id: "demo", username: "Arion", email: demoLogin.email };
  const accounts = new Map<string, { account: Account; password: string; data: AccountData }>();
  const sessions = new Map<string, { email: string; expires: number }>();
  let nextId = 0;
  const monday = startOfWeek(now());
  const today = toIsoDate(now());
  const demoWorkouts = initialWorkouts.map((item, index) => {
    const day = createEmptyWorkoutDay(addDays(monday, index));
    return { ...item, ...day, title: item.title, time: item.time,
      type: item.type, durationMinutes: item.durationMinutes, muscles: item.muscles,
      intensity: item.intensity, status: day.dateIso > today && item.status === "erledigt" ? "geplant" as const : item.status,
    };
  }).filter((item) => item.status !== "ungeplant");
  accounts.set(demo.email, { account: demo, password: demoLogin.password,
    data: { workouts: copy(demoWorkouts), plans: copy(workoutTemplates), profile: copy(initialHealthProfile), target: null, logs: [] },
  });

  function user(token: string) {
    const session = sessions.get(token);
    const record = accounts.get(token === demoToken ? demo.email : session?.email ?? "");
    if (!record || (session && session.expires <= now().getTime())) {
      throw new ApiError(401, "Deine Anmeldung ist abgelaufen.");
    }
    return record;
  }

  function signIn(account: Account) {
    if (account.id === demo.id) return { token: demoToken, user: account };
    const token = `mock-${++nextId}-${now().getTime()}`;
    sessions.set(token, { email: account.email, expires: now().getTime() + 24 * 60 * 60 * 1000 });
    return { token, user: account };
  }

  async function run<T>(method: keyof AppApi, action: () => T) {
    await options.before?.(method);
    const result = action();
    return result === undefined ? result : copy(result);
  }

  function putWorkout(data: AccountData, workout: Workout) {
    if (workout.status === "ungeplant") throw new ApiError(400, "Der Tag hat keinen speicherbaren Eintrag.");
    if (workout.dateIso > toIsoDate(now()) && ["erledigt", "verpasst"].includes(workout.status)) {
      throw new ApiError(400, "Zukünftige Trainings bleiben geplant.");
    }
    data.workouts = [...data.workouts.filter((item) => item.dateIso !== workout.dateIso), copy(workout)];
    return workout;
  }

  return {
    login: (input) => run("login", () => {
      const record = accounts.get(input.email.trim().toLowerCase());
      if (!record || record.password !== input.password) throw new ApiError(401, "E-Mail oder Passwort ist falsch.");
      return signIn(record.account);
    }),
    register: (input) => run("register", () => {
      const invalid = Object.values(validateRegistration(input)).find(Boolean);
      if (invalid) throw new ApiError(400, invalid);
      const email = input.email.trim().toLowerCase();
      const username = input.username.trim();
      if (accounts.has(email) || [...accounts.values()].some((record) => record.account.username.toLowerCase() === username.toLowerCase())) {
        throw new ApiError(409, "E-Mail oder Name ist bereits vergeben.");
      }
      const account = { id: `user-${++nextId}`, username, email };
      accounts.set(email, { account, password: input.password, data: {
        workouts: [], plans: copy(workoutTemplates), profile: null, target: null, logs: [],
      } });
      return signIn(account);
    }),
    me: (token) => run("me", () => user(token).account),
    logout: (token) => run("logout", () => { sessions.delete(token); }),
    listExercises: () => run("listExercises", () => exercises),
    listWorkouts: (token) => run("listWorkouts", () => user(token).data.workouts),
    saveWorkout: (token, workout) => run("saveWorkout", () => putWorkout(user(token).data, workout)),
    setStatus: (token, workout, status) => run("setStatus", () => {
      const data = user(token).data;
      const existing = data.workouts.find((item) => item.id === workout.id);
      if (!existing) throw new ApiError(404, "Training nicht gefunden.");
      if (existing.status === "ruhe" || !["geplant", "verpasst", "erledigt"].includes(status)) {
        throw new ApiError(400, "Der Status kann für diesen Tag nicht geändert werden.");
      }
      return putWorkout(data, { ...existing, status });
    }),
    deleteWorkout: (token, workout) => run("deleteWorkout", () => {
      const data = user(token).data;
      data.workouts = data.workouts.filter((item) => item.id !== workout.id);
    }),
    listPlans: (token) => run("listPlans", () => user(token).data.plans),
    savePlan: (token, plan) => run("savePlan", () => {
      const data = user(token).data;
      data.plans = [...data.plans.filter((item) => item.id !== plan.id), copy(plan)];
      return plan;
    }),
    deletePlan: (token, plan) => run("deletePlan", () => {
      const data = user(token).data;
      data.plans = data.plans.filter((item) => item.id !== plan.id);
    }),
    getProfile: (token) => run("getProfile", () => user(token).data.profile),
    saveProfile: (token, profile) => run("saveProfile", () => {
      user(token).data.profile = copy(profile);
      return profile;
    }),
    getMacroTarget: (token) => run("getMacroTarget", () => user(token).data.target),
    saveMacroTarget: (token, target) => run("saveMacroTarget", () => {
      user(token).data.target = copy(target);
      return target;
    }),
    listMacroLogs: (token) => run("listMacroLogs", () => user(token).data.logs),
    saveMacroLog: (token, log) => run("saveMacroLog", () => {
      const data = user(token).data;
      data.logs = [...data.logs.filter((item) => item.dateIso !== log.dateIso), copy(log)];
      return log;
    }),
    deleteMacroLog: (token, dateIso) => run("deleteMacroLog", () => {
      const data = user(token).data;
      data.logs = data.logs.filter((item) => item.dateIso !== dateIso);
    }),
  };
}

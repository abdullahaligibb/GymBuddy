import { ApiError, FeatureUnavailableError, AppApi, validateLogin, validateRegistration } from "./api";
import { mapExerciseCatalogResponse } from "./exerciseCatalogApi";
import { fromWorkoutDto, toWorkoutDto, WorkoutDto } from "./workoutAdapter";
import { parseIsoDate, toIsoDate } from "../domain/calendar";
import type { Account, DailyMacroLog, HealthProfile, MacroValues, Session, Workout, WorkoutPlan } from "../types";

type Json = Record<string, unknown>;
const invalid = () => new ApiError(502, "Der Server hat unvollständige oder ungültige Daten geliefert.");
function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Json;
}
function string(value: unknown): string { if (typeof value !== "string" || !value.trim()) throw invalid(); return value; }
function list(value: unknown): unknown[] { if (!Array.isArray(value)) throw invalid(); return value; }
function strings(value: unknown): string[] { return list(value).map(string); }
function number(value: unknown): number { if (typeof value !== "number" || !Number.isFinite(value)) throw invalid(); return value; }
function date(value: unknown): string {
  const text = string(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || toIsoDate(parseIsoDate(text)) !== text) throw invalid();
  return text;
}
function account(value: unknown): Account { const data = object(value); return { id: string(data.id), username: string(data.username), email: string(data.email) }; }
function session(value: unknown): Session { const data = object(value); return { token: string(data.token), user: account(data.user) }; }

function workout(value: unknown): Workout {
  const data = object(value);
  string(data.id); string(data.name); date(data.date);
  if (!["GEPLANT", "ERLEDIGT", "VERPASST", "RUHE"].includes(String(data.status))) throw invalid();
  if (data.type !== undefined && !["Push", "Pull", "Legs", "Full Body", "Upper Body", "Lower Body", "Cardio", "Mobility", "Rest Day"].includes(String(data.type))) throw invalid();
  if (data.intensity !== undefined && !["Leicht", "Mittel", "Schwer"].includes(String(data.intensity))) throw invalid();
  for (const key of ["notes", "sourceTemplateId", "trainingPlanId"]) if (data[key] != null && typeof data[key] !== "string") throw invalid();
  if (data.duration != null) number(data.duration);
  if (data.time != null && (typeof data.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))) throw invalid();
  if (data.muscles !== undefined) strings(data.muscles);
  if (data.exercises !== undefined) for (const raw of list(data.exercises)) {
    const row = object(raw); string(row.exerciseId); number(row.position);
    if (row.id != null) string(row.id);
    if (row.notes != null && typeof row.notes !== "string") throw invalid();
    if (row.sets != null) number(row.sets);
    if (row.reps != null) number(row.reps);
    if (row.repetitions != null && typeof row.repetitions !== "string") throw invalid();
    if (row.weight != null) number(row.weight);
    if (row.restSeconds != null) number(row.restSeconds);
    if (row.exercise != null) {
      const entry = object(row.exercise);
      for (const key of ["name", "externalId", "catalogId"]) if (entry[key] != null) string(entry[key]);
      if (entry.description != null && typeof entry.description !== "string") throw invalid();
      if (entry.targetMuscles !== undefined) strings(entry.targetMuscles);
      if (entry.equipments !== undefined) strings(entry.equipments);
    }
  }
  const result = fromWorkoutDto(data as WorkoutDto);
  if (!result) throw invalid();
  return result;
}
function plan(value: unknown): WorkoutPlan {
  const data = object(value);
  string(data.id); string(data.name); string(data.goal); number(data.durationMinutes); strings(data.muscles);
  if (!Number.isInteger(data.durationMinutes) || (data.durationMinutes as number) < 1 || (data.durationMinutes as number) > 600 || (data.name as string).length > 60 || (data.goal as string).length > 300 || !(data.muscles as string[]).length) throw invalid();
  if (!["Leicht", "Mittel", "Schwer"].includes(String(data.difficulty)) || !["Push", "Pull", "Legs", "Full Body", "Upper Body", "Lower Body", "Cardio"].includes(String(data.type))) throw invalid();
  for (const raw of list(data.exercises)) {
    const row = object(raw); string(row.exerciseId); number(row.sets); string(row.repetitions);
    if (!Number.isInteger(row.sets) || (row.sets as number) < 1 || (row.sets as number) > 100 || (row.repetitions as string).length > 50) throw invalid();
    if (row.weightKg !== undefined) number(row.weightKg);
    if (row.restSeconds !== undefined) number(row.restSeconds);
    if (row.notes !== undefined && typeof row.notes !== "string") throw invalid();
  }
  return data as WorkoutPlan;
}
function profile(value: unknown): HealthProfile | null {
  if (value === null) return null;
  const data = object(value);
  for (const key of ["name", "birthDateIso", "targetDateIso", "activityLevel", "primaryGoal", "experienceLevel"]) string(data[key]);
  for (const key of ["heightCm", "weightKg", "targetWeightKg", "weeklyWorkoutGoal"]) number(data[key]);
  strings(data.preferredTrainingDays);
  if (!["Wenig aktiv", "Leicht aktiv", "Moderat aktiv", "Sehr aktiv"].includes(String(data.activityLevel)) || !["Muskelaufbau", "Kraftaufbau", "Fettabbau", "Allgemeine Fitness"].includes(String(data.primaryGoal)) || !["Einsteiger", "Mittel", "Fortgeschritten"].includes(String(data.experienceLevel))) throw invalid();
  if (data.energyFormula !== undefined && !["female", "male"].includes(String(data.energyFormula))) throw invalid();
  date(data.birthDateIso); date(data.targetDateIso);
  return data as HealthProfile;
}
function macros(value: unknown): MacroValues {
  const data = object(value); const result = { calories: number(data.calories), protein: number(data.protein), carbs: number(data.carbs), fat: number(data.fat) };
  if (Object.values(result).some((n) => !Number.isInteger(n) || n < 0 || n > 100000)) throw invalid();
  return result;
}
function log(value: unknown): DailyMacroLog { const data = object(value); return { ...macros(data), dateIso: date(data.dateIso ?? data.date) }; }

export type HttpApiOptions = { contract?: "legacy" | "v1"; request?: typeof fetch; timeoutMs?: number };

/** v1 is the complete PostgreSQL-backed API; legacy is retained for older servers. */
export function createHttpApi(baseUrl: string, options: HttpApiOptions = {}): AppApi {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("Eine gültige Serveradresse ohne Zugangsdaten angeben.");
  const base = url.toString().replace(/\/+$/, "");
  const full = options.contract === "v1";
  const request = options.request ?? fetch;
  const unavailable = (feature: string): never => { throw new FeatureUnavailableError(`${feature} ist auf diesem Server noch nicht verfügbar.`); };

  async function send(method: string, path: string, token?: string, body?: unknown): Promise<Json> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);
    try {
      const response = await request(`${base}${path}`, {
        method, signal: controller.signal, redirect: "error",
        headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) {
        const message = response.status === 401 ? "Deine Anmeldung ist ungültig oder abgelaufen." : response.status === 409 ? "Die Daten wurden zwischenzeitlich geändert oder existieren bereits." : response.status === 400 || response.status === 422 ? "Der Server hat die Eingaben abgelehnt. Bitte kontrollieren." : "Die Serveranfrage ist fehlgeschlagen. Bitte erneut versuchen.";
        throw new ApiError(response.status, message);
      }
      if (response.status === 204) return {};
      try { return object(await response.json()); }
      catch { if (controller.signal.aborted) throw new Error("Response timeout"); throw invalid(); }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? 504 : 0, controller.signal.aborted ? "Der Server antwortet nicht rechtzeitig. Bitte erneut versuchen." : "Der Server ist nicht erreichbar. Bitte Verbindung und Serveradresse prüfen.");
    } finally { clearTimeout(timer); }
  }
  async function feature(method: string, path: string, label: string, token: string, body?: unknown) {
    if (!full) return unavailable(label);
    try { return await send(method, path, token, body); }
    catch (error) {
      if (error instanceof ApiError && ([405, 501].includes(error.status) || error.status === 404 && method === "GET")) return unavailable(label);
      throw error;
    }
  }
  async function authenticate(path: string, input: Parameters<AppApi["register"]>[0] | Parameters<AppApi["login"]>[0]) {
    const errors = "username" in input ? validateRegistration(input) : validateLogin(input);
    if (Object.values(errors).some(Boolean)) throw new ApiError(400, "Bitte die Anmeldedaten kontrollieren.");
    return session(await send("POST", path, undefined, { ...input, email: input.email.trim().toLowerCase(), ...("username" in input ? { username: input.username.trim() } : {}) }));
  }
  return {
    mode: "server",
    sessionKey: `gymbuddy.server.${Array.from(base).map((c) => c.codePointAt(0)!.toString(16)).join("-")}`,
    notice: full ? undefined : "Der verbundene Server unterstützt noch nicht alle Funktionen. Vollständiges Speichern von Trainings, Plänen, Profil und Makrodaten ist noch nicht verfügbar.",
    login: (input) => authenticate("/api/auth/login", input),
    register: (input) => authenticate("/api/auth/register", input),
    me: async (token) => account((await send("GET", "/api/auth/me", token)).user),
    logout: async (token) => { if (full) await send("POST", "/api/auth/logout", token); },
    listExercises: async () => {
      try { return mapExerciseCatalogResponse(await send("GET", "/api/exercises?limit=25")); }
      catch (error) { if (error instanceof ApiError) throw error; throw invalid(); }
    },
    listWorkouts: async (token) => list((await send("GET", "/api/workouts", token)).workouts).map(workout),
    saveWorkout: async (token, value) => {
      // Never emulate a full save by deleting the old workout and issuing partial POSTs.
      const result = await feature("PUT", `/api/workouts/by-date/${encodeURIComponent(value.dateIso)}`, "Vollständiges Speichern von Trainings", token, toWorkoutDto(value));
      return workout(result.workout);
    },
    setStatus: async (token, value, status) => {
      if (!["geplant", "erledigt", "verpasst"].includes(status)) throw new ApiError(400, "Dieser Status wird vom Server nicht unterstützt.");
      return workout((await send("PATCH", `/api/workouts/${encodeURIComponent(value.id)}/status`, token, { status: status.toUpperCase() })).workout);
    },
    deleteWorkout: async (token, value) => { await send("DELETE", `/api/workouts/${encodeURIComponent(value.id)}`, token); },
    listPlans: async (token) => list((await feature("GET", "/api/plans", "Trainingspläne", token)).plans).map(plan),
    savePlan: async (token, value) => plan((await feature("PUT", `/api/plans/${encodeURIComponent(value.id)}`, "Trainingspläne", token, value)).plan),
    deletePlan: async (token, value) => { await feature("DELETE", `/api/plans/${encodeURIComponent(value.id)}`, "Trainingspläne", token); },
    getProfile: async (token) => profile((await feature("GET", "/api/profile", "Profil", token)).profile),
    saveProfile: async (token, value) => {
      const result = profile((await feature("PUT", "/api/profile", "Profil", token, value)).profile);
      if (!result) throw invalid(); return result;
    },
    getMacroTarget: async (token) => { const result = (await feature("GET", "/api/macros/target", "Makroziele", token)).target; return result === null ? null : macros(result); },
    saveMacroTarget: async (token, value) => macros((await feature("PUT", "/api/macros/target", "Makroziele", token, value)).target),
    listMacroLogs: async (token) => list((await feature("GET", "/api/macros/logs", "Tageswerte", token)).logs).map(log),
    saveMacroLog: async (token, value) => log((await feature("PUT", `/api/macros/logs/${encodeURIComponent(value.dateIso)}`, "Tageswerte", token, value)).log),
    deleteMacroLog: async (token, value) => { await feature("DELETE", `/api/macros/logs/${encodeURIComponent(value)}`, "Tageswerte", token); },
  };
}

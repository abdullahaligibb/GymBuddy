import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiMessage } from "./api";
import type { AppApi } from "./api";
import type { DailyMacroLog, Exercise, HealthProfile, MacroValues, Workout, WorkoutPlan } from "../types";
import { exercises as localExercises } from "../data/exercises";
import { mergeExerciseCatalogs } from "../domain/exerciseCatalog";

export type TrainingData = {
  workouts: Workout[];
  plans: WorkoutPlan[];
  profile: HealthProfile | null;
  exercises: Exercise[];
  macroTarget: MacroValues | null;
  macroLogs: DailyMacroLog[];
};

export function useTrainingData(api: AppApi, token: string, onExpired: (token: string, expired: boolean) => void) {
  const [data, setData] = useState<TrainingData>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  const report = useCallback((failure: unknown) => {
    if (failure instanceof ApiError && failure.status === 401) onExpired(token, true);
    else setError(apiMessage(failure));
  }, [onExpired, token]);

  const load = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setLoading(true);
    setError("");
    try {
      const [workouts, plans, profile, exercises, macroTarget, macroLogs] = await Promise.all([
        api.listWorkouts(token), api.listPlans(token), api.getProfile(token),
        api.listExercises(), api.getMacroTarget(token), api.listMacroLogs(token),
      ]);
      setData({ workouts, plans, profile, exercises: mergeExerciseCatalogs(localExercises, exercises), macroTarget, macroLogs });
    } catch (failure) {
      report(failure);
    } finally {
      setLoading(false);
      running.current = false;
    }
  }, [api, report, token]);

  useEffect(() => { void load(); }, [load]);

  async function mutate<T>(
    request: () => Promise<T>,
    update: (current: TrainingData, result: T) => TrainingData,
  ): Promise<T> {
    if (running.current) throw new ApiError(409, "Ein Vorgang läuft bereits.");
    running.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await request();
      setData((current) => current && update(current, result));
      return result;
    } catch (failure) {
      report(failure);
      throw failure;
    } finally {
      setSaving(false);
      running.current = false;
    }
  }

  return { data, loading, saving, error, load, mutate };
}

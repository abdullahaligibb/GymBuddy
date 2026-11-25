import type { Exercise, ExerciseEquipment, MuscleGroup } from "../types";

const muscles: Record<string, MuscleGroup> = { pectorals: "Brust", chest: "Brust", lats: "Rücken", "upper back": "Rücken", back: "Rücken", delts: "Schulter", shoulders: "Schulter", biceps: "Bizeps", triceps: "Trizeps", abs: "Bauch", abdominals: "Bauch", quads: "Beine", quadriceps: "Beine", hamstrings: "Beine", glutes: "Gesäß", calves: "Waden" };
const equipment: Record<string, ExerciseEquipment> = { barbell: "Langhantel", dumbbell: "Kurzhanteln", cable: "Kabelzug", kettlebell: "Kettlebell", "body weight": "Eigengewicht", bodyweight: "Eigengewicht", "leverage machine": "Maschine", "smith machine": "Maschine" };
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim()) : [];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

/** Maps the existing Express /api/exercises response, not database workout IDs. */
export function mapApiExercise(value: unknown): Exercise {
  if (!value || typeof value !== "object") throw new Error("Ungültiger Eintrag im Übungskatalog.");
  const raw = value as Record<string, unknown>;
  const externalId = text(raw.id) || text(raw.exerciseId);
  const name = text(raw.name);
  if (!externalId || !name) throw new Error("Im Übungskatalog fehlen ID oder Name.");
  const targets = strings(raw.targetMuscles);
  const tools = strings(raw.equipments);
  const description = text(raw.beschreibung) || text(raw.description) || strings(raw.instructions).join("\n") || text(raw.instructions);
  return {
    id: `api:${externalId}`, externalId, source: "api", name,
    muscle: targets.map((x) => muscles[x.toLowerCase()]).find(Boolean) ?? "Unbekannt",
    equipment: tools.map((x) => equipment[x.toLowerCase()]).find(Boolean) ?? "Unbekannt",
    level: "Nicht angegeben", targetMuscles: targets, equipments: tools,
    description: description || "Keine Anleitung hinterlegt.",
  };
}

export function mapExerciseCatalogResponse(payload: unknown): Exercise[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { exercises?: unknown }).exercises)) throw new Error("Die Antwort enthält keinen gültigen Übungskatalog.");
  const result = ((payload as { exercises: unknown[] }).exercises).map(mapApiExercise);
  return Array.from(new Map(result.map((item) => [item.id, item])).values());
}

export async function fetchExerciseCatalog(baseUrl: string, options: { signal?: AbortSignal; name?: string; after?: string } = {}, request: typeof fetch = fetch): Promise<Exercise[]> {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/api/exercises`);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Ungültige API-Adresse.");
  url.searchParams.set("limit", "25");
  if (options.name?.trim()) url.searchParams.set("name", options.name.trim());
  if (options.after) url.searchParams.set("after", options.after);
  const response = await request(url.toString(), { signal: options.signal });
  if (!response.ok) throw new Error("Der Übungskatalog konnte nicht geladen werden. Bitte erneut versuchen.");
  return mapExerciseCatalogResponse(await response.json());
}

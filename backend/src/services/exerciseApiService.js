// backend/src/services/exerciseApiService.js
const BASE_URL = process.env.EXERCISE_API_URL || 'https://oss.exercisedb.dev/api/v1';

async function fetchExercisesFromApi({
  name,
  targetMuscles,
  secondaryMuscles,
  bodyParts,
  equipments,
  limit = 10,
  after,
  before,
} = {}) {
  const params = new URLSearchParams();

  if (name) params.append('name', name);
  if (targetMuscles) params.append('targetMuscles', targetMuscles);
  if (secondaryMuscles) params.append('secondaryMuscles', secondaryMuscles);
  if (bodyParts) params.append('bodyParts', bodyParts);
  if (equipments) params.append('equipments', equipments);
  if (after) params.append('after', after);
  if (before) params.append('before', before);

  // API erlaubt nur Werte zwischen 1 und 25
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);
  params.append('limit', String(safeLimit));

  const url = `${BASE_URL}/exercises?${params.toString()}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

  if (!response.ok) {
    throw new Error(`ExerciseDB API Fehler: ${response.status}`);
  }

  const json = await response.json();
  const rawList = json.data?.exercises || json.data || [];

  return rawList.map((item) => ({
    id: item.exerciseId || item.id,
    name: item.name,
    beschreibung: Array.isArray(item.instructions)
      ? item.instructions.join('\n')
      : item.instructions || 'Keine Beschreibung vorhanden.',
    targetMuscles: item.targetMuscles || [],
    secondaryMuscles: item.secondaryMuscles || [],
    bodyParts: item.bodyParts || [],
    equipments: item.equipments || [],
    gifUrl: item.gifUrl || null,
  }));
}

module.exports = { fetchExercisesFromApi };

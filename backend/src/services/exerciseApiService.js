// backend/src/services/exerciseApiService.js
const BASE_URL = process.env.EXERCISE_API_URL || 'https://exercisedb-api.vercel.app/api/v1';


 /* Holt Übungen von der externen API und mappt sie auf das GymBuddy-Format*/
 
async function fetchExercisesFromApi({ search = '', muscle = '', limit = 50, offset = 0 } = {}) {
  let url = `${BASE_URL}/exercises?limit=${limit}&offset=${offset}`;

  // Falls nach Suchbegriff gefiltert wird (je nach Endpoint in der OSS-Doku)
  if (search) {
    url = `${BASE_URL}/exercises/search?q=${encodeURIComponent(search)}&limit=${limit}`;
  } else if (muscle) {
    url = `${BASE_URL}/muscles/${encodeURIComponent(muscle)}/exercises?limit=${limit}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ExerciseDB API Fehler: ${response.status}`);
  }

  const json = await response.json();
  // Die OSS-API verpackt die Ergebnisse meist in json.data.exercises oder json.data
  const rawList = json.data?.exercises || json.data || [];

  // Mapping auf euer einheitliches GymBuddy-Schema
  return rawList.map((item) => ({
    id: item.exerciseId || item.id,
    name: item.name,
    beschreibung: Array.isArray(item.instructions)
      ? item.instructions.join('\n')
      : item.instructions || 'Keine Beschreibung vorhanden.',
    muskelgruppen: item.targetMuscles || item.bodyParts || [],
    equipment: item.equipments || [],
    gifUrl: item.gifUrl || null,
  }));
}

module.exports = { fetchExercisesFromApi };
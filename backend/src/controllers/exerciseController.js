// backend/src/controllers/exerciseController.js
const { fetchExercisesFromApi } = require('../services/exerciseApiService');

async function getExercises(req, res) {
  try {
    const {
      name,
      targetMuscles,
      secondaryMuscles,
      bodyParts,
      equipments,
      limit,
      after,
      before,
    } = req.query;

    const exercises = await fetchExercisesFromApi({
      name: name?.trim(),
      targetMuscles: targetMuscles?.trim(),
      secondaryMuscles: secondaryMuscles?.trim(),
      bodyParts: bodyParts?.trim(),
      equipments: equipments?.trim(),
      limit,
      after,
      before,
    });

    await require('../services/catalogService').cacheExternalExercises(exercises);
    res.json({ exercises });
  } catch (error) {
    console.error('Fehler beim Laden der Übungen:', error.code || error.name);
    res.status(502).json({
      error: 'CATALOG_UNAVAILABLE',
      message: 'Übungskatalog konnte nicht von der externen API geladen werden.',
    });
  }
}

module.exports = { getExercises };

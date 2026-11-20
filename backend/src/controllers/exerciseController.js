const { fetchExercisesFromApi } = require('../services/exerciseApiService');

async function getExercises(req, res) {
  try {
    const { search, muscle, limit, offset } = req.query;
    const exercises = await fetchExercisesFromApi({
      search: search?.trim(),
      muscle: muscle?.trim(),
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });

    res.json({ exercises });
  } catch (error) {
    console.error('Fehler beim Laden der Übungen:', error.message);
    res.status(502).json({
      error: 'CATALOG_UNAVAILABLE',
      message: 'Übungskatalog konnte nicht von der externen API geladen werden.',
    });
  }
}

module.exports = { getExercises };
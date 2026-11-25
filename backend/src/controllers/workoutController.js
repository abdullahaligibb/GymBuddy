const workoutService = require('../services/workoutService');

async function getWorkouts(req, res) {
  try {
    const { date, trainingPlanId } = req.query;
    const workouts = await workoutService.getWorkoutsByUser(req.user.id, {
      date,
      trainingPlanId,
    });
    res.json({ workouts });
  } catch (error) {
    console.error('Fehler beim Laden der Workouts:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Workouts konnten nicht geladen werden.' });
  }
}

async function getWorkout(req, res) {
  try {
    const workout = await workoutService.getWorkoutById(req.user.id, req.params.id);
    res.json({ workout });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR', message: error.message });
  }
}

async function createWorkout(req, res) {
  try {
    const { name, date, duration, trainingPlanId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Ein Name für das Workout ist erforderlich.',
      });
    }

    const workout = await workoutService.createWorkout(req.user.id, {
      name: name.trim(),
      date,
      duration,
      trainingPlanId,
    });

    res.status(201).json({ workout });
  } catch (error) {
    console.error('Fehler beim Erstellen des Workouts:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Workout konnte nicht erstellt werden.' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const workout = await workoutService.updateWorkoutStatus(req.user.id, req.params.id, status);
    res.json({ workout });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: 'ERROR', message: error.message });
  }
}

async function deleteWorkout(req, res) {
  try {
    await workoutService.deleteWorkout(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: 'ERROR', message: error.message });
  }
}

async function addExercise(req, res) {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Der Übungsname (name) ist erforderlich.',
      });
    }

    const workoutExercise = await workoutService.addExerciseToWorkout(
      req.user.id,
      req.params.id,
      req.body
    );

    res.status(201).json({ workoutExercise });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: 'ERROR', message: error.message });
  }
}

module.exports = {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateStatus,
  deleteWorkout,
  addExercise,
};
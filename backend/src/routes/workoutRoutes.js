// backend/src/routes/workoutRoutes.js
const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const authMiddleware = require('../middlewares/authMiddleware');

// Alle Workout-Routen erfordern einen gültigen JWT
router.use(authMiddleware);

router.get('/', workoutController.getWorkouts);
router.post('/', workoutController.createWorkout);
router.get('/:id', workoutController.getWorkout);
router.patch('/:id/status', workoutController.updateStatus);
router.delete('/:id', workoutController.deleteWorkout);
router.post('/:id/exercises', workoutController.addExercise);

module.exports = router;
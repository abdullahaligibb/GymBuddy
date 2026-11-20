const express = require('express');
const router = express.Router();
const { getExercises } = require('../controllers/exerciseController');

// Entspricht GET /api/exercises
router.get('/', getExercises);

module.exports = router;
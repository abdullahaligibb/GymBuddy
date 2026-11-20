// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Geschützte Test-Route, um den eingeloggten User abzurufen
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
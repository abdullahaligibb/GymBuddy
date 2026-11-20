const authService = require('../services/authService');

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Username, E-Mail und Passwort sind erforderlich.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
      });
    }

    const result = await authService.registerUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: status === 409 ? 'CONFLICT' : 'SERVER_ERROR',
      message: error.message || 'Fehler bei der Registrierung.',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: 'VALIDATION',
        message: 'E-Mail und Passwort sind erforderlich.',
      });
    }

    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: status === 401 ? 'UNAUTHORIZED' : 'SERVER_ERROR',
      message: error.message || 'Fehler beim Login.',
    });
  }
}

async function getMe(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User nicht gefunden.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Profil konnte nicht geladen werden.' });
  }
}

module.exports = { register, login, getMe };
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function registerUser({ username, email, password }) {
  // Prüfen, ob Email oder Username bereits vergeben sind
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    const error = new Error('Username oder E-Mail ist bereits vergeben.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      currentStreak: true,
      createdAt: true,
    },
  });

  const token = generateToken(user);
  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Ungültige E-Mail oder falsches Passwort.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Ungültige E-Mail oder falsches Passwort.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  // passwordHash niemals ans Frontend zurücksenden
  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
}

async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      currentStreak: true,
      age: true,
      gender: true,
      heightCm: true,
      weightKg: true,
      targetWeightKg: true,
      targetDate: true,
      activityLevel: true,
    },
  });
}

module.exports = { registerUser, loginUser, getUserById };
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const prisma = require('../lib/prisma');
const v = require('../lib/validation');
const { HttpError } = require('../lib/errors');
const select = { id: true, username: true, email: true };
function credentials(body, register = false) {
  const x = v.object(body);
  const email = v.text(x.email, 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    v.fail('Gültige E-Mail eingeben.');
  if (
    typeof x.password !== 'string' ||
    x.password.length < (register ? 8 : 1) ||
    Buffer.byteLength(x.password, 'utf8') > 72
  )
    v.fail(
      'Passwort muss bei Registrierung mindestens 8 Zeichen und höchstens 72 UTF-8-Bytes enthalten.',
    );
  return {
    email,
    password: x.password,
    ...(register ? { username: v.text(x.username, 2, 40) } : {}),
  };
}
function session(user) {
  return {
    user,
    token: jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', jwtid: randomUUID(), expiresIn: '7d' },
    ),
  };
}
async function registerUser(body) {
  const { username, email, password } = credentials(body, true);
  const exists = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { username: { equals: username, mode: 'insensitive' } },
      ],
    },
  });
  if (exists)
    throw new HttpError(409, 'E-Mail oder Benutzername bereits vergeben.');
  const passwordHash = await bcrypt.hash(password, 10);
  return session(
    await prisma.user.create({
      data: { username, email, passwordHash },
      select,
    }),
  );
}
async function loginUser(body) {
  const { email, password } = credentials(body);
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(401, 'E-Mail oder Passwort ist falsch.');
  return session({ id: user.id, username: user.username, email: user.email });
}
async function getUserById(id) {
  return prisma.user.findUnique({ where: { id }, select });
}
module.exports = { registerUser, loginUser, getUserById };

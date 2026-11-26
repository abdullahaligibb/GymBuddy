const jwt = require('jsonwebtoken');
const { createHash } = require('node:crypto');
const prisma = require('../lib/prisma');
const { HttpError, asyncRoute } = require('../lib/errors');
module.exports = asyncRoute(async (req, res, next) => {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !/^Bearer [^ ]+$/.test(header))
    throw new HttpError(401, 'Anmeldung erforderlich.');
  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch {
    throw new HttpError(401, 'Anmeldung ungültig oder abgelaufen.');
  }
  if (typeof decoded.userId !== 'string' || !Number.isFinite(decoded.exp))
    throw new HttpError(401, 'Ungültiger Token.');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const [revoked, user] = await Promise.all([
    prisma.revokedToken.findUnique({ where: { tokenHash } }),
    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true },
    }),
  ]);
  if (revoked || !user)
    throw new HttpError(401, 'Anmeldung ungültig oder abgelaufen.');
  req.user = user;
  req.auth = { tokenHash, expiresAt: new Date(decoded.exp * 1000) };
  next();
});

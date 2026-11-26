const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { asyncRoute } = require('../lib/errors');
const s = require('../services/accountDataService');
const plans = express.Router(),
  profile = express.Router(),
  macros = express.Router();
for (const router of [plans, profile, macros]) router.use(auth);
plans.get(
  '/',
  asyncRoute(async (req, res) =>
    res.json({ plans: await s.listPlans(req.user.id) }),
  ),
);
plans.put(
  '/:id',
  asyncRoute(async (req, res) =>
    res.json({ plan: await s.savePlan(req.user.id, req.params.id, req.body) }),
  ),
);
plans.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    await s.deletePlan(req.user.id, req.params.id);
    res.sendStatus(204);
  }),
);
profile.get(
  '/',
  asyncRoute(async (req, res) =>
    res.json({ profile: await s.getProfile(req.user.id) }),
  ),
);
profile.put(
  '/',
  asyncRoute(async (req, res) =>
    res.json({ profile: await s.saveProfile(req.user.id, req.body) }),
  ),
);
macros.get(
  '/target',
  asyncRoute(async (req, res) =>
    res.json({ target: await s.getTarget(req.user.id) }),
  ),
);
macros.put(
  '/target',
  asyncRoute(async (req, res) =>
    res.json({ target: await s.saveTarget(req.user.id, req.body) }),
  ),
);
macros.get(
  '/logs',
  asyncRoute(async (req, res) =>
    res.json({ logs: await s.listLogs(req.user.id) }),
  ),
);
macros.put(
  '/logs/:date',
  asyncRoute(async (req, res) =>
    res.json({ log: await s.saveLog(req.user.id, req.params.date, req.body) }),
  ),
);
macros.delete(
  '/logs/:date',
  asyncRoute(async (req, res) => {
    await s.deleteLog(req.user.id, req.params.date);
    res.sendStatus(204);
  }),
);
module.exports = { plans, profile, macros };

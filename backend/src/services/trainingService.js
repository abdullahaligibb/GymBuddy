const prisma = require('../lib/prisma');
const v = require('../lib/validation');
const { HttpError } = require('../lib/errors');
const { resolveExercise } = require('./catalogService');
const include = {
  exercises: { orderBy: { position: 'asc' }, include: { exercise: true } },
  trainingPlan: true,
};
function dto(row) {
  const { trainingPlan, exercises, ...data } = row;
  return {
    ...data,
    trainingPlanId: trainingPlan?.clientId ?? row.trainingPlanId,
    exercises: exercises.map((x) => ({
      ...x,
      exercise: {
        ...x.exercise,
        catalogId: x.catalogId ?? x.exercise.catalogId,
      },
    })),
  };
}
async function list(userId, filters = {}) {
  const where = { userId };
  if (filters.date) where.date = v.date(filters.date);
  return (
    await prisma.workout.findMany({
      where,
      include,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })
  ).map(dto);
}
async function owned(db, userId, id) {
  const row = await db.workout.findFirst({ where: { id, userId }, include });
  if (!row) throw new HttpError(404, 'Training nicht gefunden.');
  return row;
}
async function save(userId, day, body) {
  const { exercises, trainingPlanId, ...data } = v.workout(body, day);
  return prisma.$transaction(
    async (db) => {
      let plan = null;
      if (trainingPlanId) {
        plan = await db.trainingPlan.findFirst({
          where: {
            userId,
            OR: [{ id: trainingPlanId }, { clientId: trainingPlanId }],
          },
        });
        if (!plan)
          throw new HttpError(404, 'Eigener Trainingsplan nicht gefunden.');
      }
      const resolved = [];
      for (const row of exercises)
        resolved.push({
          ...row,
          exerciseId: (await resolveExercise(db, userId, row.catalogId)).id,
        });
      const record = await db.workout.upsert({
        where: { userId_date: { userId, date: day } },
        create: { ...data, userId, trainingPlanId: plan?.id ?? null },
        update: { ...data, trainingPlanId: plan?.id ?? null },
      });
      await db.workoutExercise.deleteMany({ where: { workoutId: record.id } });
      if (resolved.length)
        await db.workoutExercise.createMany({
          data: resolved.map((x) => ({ ...x, workoutId: record.id })),
        });
      return dto(
        await db.workout.findUniqueOrThrow({
          where: { id: record.id },
          include,
        }),
      );
    },
    { isolationLevel: 'Serializable', timeout: 15000 },
  );
}
async function get(userId, id) {
  return dto(await owned(prisma, userId, id));
}
async function status(userId, id, value) {
  v.oneOf(value, ['GEPLANT', 'ERLEDIGT', 'VERPASST']);
  return prisma.$transaction(
    async (db) => {
      const row = await owned(db, userId, id);
      if (row.status === 'RUHE')
        throw new HttpError(400, 'Ein Ruhetag hat keinen Trainingsstatus.');
      if (row.date > v.today() && value !== 'GEPLANT')
        throw new HttpError(400, 'Zukünftige Trainings bleiben geplant.');
      return dto(
        await db.workout.update({
          where: { id: row.id },
          data: { status: value },
          include,
        }),
      );
    },
    { isolationLevel: 'Serializable' },
  );
}
async function remove(userId, id) {
  const result = await prisma.workout.deleteMany({ where: { id, userId } });
  if (!result.count) throw new HttpError(404, 'Training nicht gefunden.');
}
module.exports = { list, save, get, status, remove, dto };

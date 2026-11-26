const prisma = require('../lib/prisma');
const v = require('../lib/validation');
const { HttpError } = require('../lib/errors');
const { resolveExercise } = require('./catalogService');
const local = require('../data/exercises.json');
const planInclude = {
  exercises: { orderBy: { position: 'asc' }, include: { exercise: true } },
};
function catalogEntry(row) {
  const original = local.find((x) => x.id === row.catalogId);
  return (
    original || {
      id: row.catalogId,
      externalId: row.exercise.externalId,
      source: 'api',
      name: row.exercise.name,
      muscle: 'Unbekannt',
      equipment: 'Unbekannt',
      level: 'Nicht angegeben',
      description: row.exercise.description || '',
      targetMuscles: row.exercise.targetMuscles,
      equipments: row.exercise.equipments,
    }
  );
}
function planDto(row) {
  return {
    id: row.clientId ?? row.id,
    name: row.name,
    goal: row.goal,
    durationMinutes: row.durationMinutes,
    type: row.type,
    difficulty: row.difficulty,
    muscles: row.muscles,
    isActive: row.isActive,
    isCustom: true,
    exercises: row.exercises.map((x) => ({
      exerciseId: x.catalogId,
      sets: x.sets,
      repetitions: x.repetitions,
      ...(x.weight === null ? {} : { weightKg: x.weight }),
      ...(x.restSeconds === null ? {} : { restSeconds: x.restSeconds }),
      ...(x.notes === null ? {} : { notes: x.notes }),
      catalogEntry: catalogEntry(x),
    })),
  };
}
async function listPlans(userId) {
  return (
    await prisma.trainingPlan.findMany({
      where: { userId },
      include: planInclude,
      orderBy: { createdAt: 'asc' },
    })
  ).map(planDto);
}
async function savePlan(userId, clientId, body) {
  const x = v.object(body);
  v.text(clientId, 1, 200);
  if (x.id !== clientId) v.fail('Plan-ID stimmt nicht überein.');
  const exercises = v.prescriptions(x.exercises, true);
  if (!exercises.length) v.fail('Der Plan braucht mindestens eine Übung.');
  if (x.isActive !== undefined && typeof x.isActive !== 'boolean') v.fail();
  const data = {
    name: v.text(x.name, 1, 60),
    goal: v.text(x.goal, 1, 300),
    durationMinutes: v.number(x.durationMinutes, 1, 600, true),
    type: v.oneOf(
      x.type,
      v.types.filter((t) => !['Rest Day', 'Mobility'].includes(t)),
    ),
    difficulty: v.oneOf(x.difficulty, v.intensities),
    muscles: v.strings(x.muscles, v.muscles, 1),
    isActive: x.isActive ?? true,
  };
  return prisma.$transaction(
    async (db) => {
      const resolved = [];
      for (const row of exercises)
        resolved.push({
          ...row,
          exerciseId: (await resolveExercise(db, userId, row.catalogId)).id,
        });
      const plan = await db.trainingPlan.upsert({
        where: { userId_clientId: { userId, clientId } },
        create: { ...data, userId, clientId },
        update: data,
      });
      await db.planExercise.deleteMany({ where: { trainingPlanId: plan.id } });
      await db.planExercise.createMany({
        data: resolved.map((row) => ({ ...row, trainingPlanId: plan.id })),
      });
      return planDto(
        await db.trainingPlan.findUniqueOrThrow({
          where: { id: plan.id },
          include: planInclude,
        }),
      );
    },
    { isolationLevel: 'Serializable', timeout: 15000 },
  );
}
async function deletePlan(userId, clientId) {
  const result = await prisma.trainingPlan.deleteMany({
    where: { userId, clientId },
  });
  if (!result.count) throw new HttpError(404, 'Eigener Plan nicht gefunden.');
}
function profileDto(row) {
  if (!row) return null;
  const { userId, energyFormula, ...data } = row;
  return { ...data, ...(energyFormula ? { energyFormula } : {}) };
}
async function getProfile(userId) {
  return profileDto(
    await prisma.healthProfile.findUnique({ where: { userId } }),
  );
}
async function saveProfile(userId, body) {
  const x = v.object(body);
  const birthDateIso = v.date(x.birthDateIso);
  if (birthDateIso >= v.today())
    v.fail('Geburtsdatum muss in der Vergangenheit liegen.');
  const data = {
    name: v.text(x.name, 1, 100),
    birthDateIso,
    heightCm: v.number(x.heightCm, 100, 250),
    weightKg: v.number(x.weightKg, 30, 350),
    targetWeightKg: v.number(x.targetWeightKg, 30, 350),
    targetDateIso: v.date(x.targetDateIso),
    activityLevel: v.oneOf(x.activityLevel, [
      'Wenig aktiv',
      'Leicht aktiv',
      'Moderat aktiv',
      'Sehr aktiv',
    ]),
    primaryGoal: v.oneOf(x.primaryGoal, [
      'Muskelaufbau',
      'Kraftaufbau',
      'Fettabbau',
      'Allgemeine Fitness',
    ]),
    experienceLevel: v.oneOf(x.experienceLevel, [
      'Einsteiger',
      'Mittel',
      'Fortgeschritten',
    ]),
    weeklyWorkoutGoal: v.number(x.weeklyWorkoutGoal, 1, 7, true),
    preferredTrainingDays: v.strings(
      x.preferredTrainingDays,
      [
        'Montag',
        'Dienstag',
        'Mittwoch',
        'Donnerstag',
        'Freitag',
        'Samstag',
        'Sonntag',
      ],
      1,
      7,
    ),
    energyFormula:
      x.energyFormula == null
        ? null
        : v.oneOf(x.energyFormula, ['male', 'female']),
  };
  return profileDto(
    await prisma.healthProfile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    }),
  );
}
function macros(body) {
  const x = v.object(body);
  return Object.fromEntries(
    ['calories', 'protein', 'carbs', 'fat'].map((key) => [
      key,
      v.number(x[key], 0, 100000, true),
    ]),
  );
}
function macroDto(row) {
  if (!row) return null;
  const { calories, protein, carbs, fat } = row;
  return { calories, protein, carbs, fat };
}
async function getTarget(userId) {
  return macroDto(await prisma.macroTarget.findUnique({ where: { userId } }));
}
async function saveTarget(userId, body) {
  const data = macros(body);
  return macroDto(
    await prisma.macroTarget.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    }),
  );
}
function logDto(row) {
  return { dateIso: row.date, ...macroDto(row) };
}
async function listLogs(userId) {
  return (
    await prisma.dailyMacroLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })
  ).map(logDto);
}
async function saveLog(userId, day, body) {
  const date = v.date(day);
  const x = v.object(body);
  if (x.dateIso !== date) v.fail('Datum stimmt nicht überein.');
  const data = macros(x);
  return logDto(
    await prisma.dailyMacroLog.upsert({
      where: { userId_date: { userId, date } },
      create: { ...data, date, userId },
      update: data,
    }),
  );
}
async function deleteLog(userId, date) {
  v.date(date);
  await prisma.dailyMacroLog.deleteMany({ where: { userId, date } });
}
module.exports = {
  listPlans,
  savePlan,
  deletePlan,
  getProfile,
  saveProfile,
  getTarget,
  saveTarget,
  listLogs,
  saveLog,
  deleteLog,
};

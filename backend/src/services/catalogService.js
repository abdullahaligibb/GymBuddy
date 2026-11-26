const prisma = require('../lib/prisma');
const localExercises = require('../data/exercises.json');
const { HttpError } = require('../lib/errors');
async function resolveExercise(db, userId, catalogId) {
  const local = localExercises.find((x) => x.id === catalogId);
  if (local)
    return db.exercise.upsert({
      where: { catalogId },
      update: {},
      create: {
        catalogId,
        name: local.name,
        description: local.description,
        targetMuscles: local.targetMuscles ?? [local.muscle],
        secondaryMuscles: [],
        equipments: local.equipments ?? [local.equipment],
      },
    });
  const found = await db.exercise.findFirst({
    where: {
      OR: [
        { catalogId },
        ...(catalogId.startsWith('api:')
          ? [{ externalId: catalogId.slice(4) }]
          : [{ id: catalogId }]),
      ],
      AND: [{ OR: [{ userId: null }, { userId }] }],
    },
  });
  if (!found)
    throw new HttpError(
      400,
      'Übung fehlt im Katalog. Bitte den Katalog erneut laden.',
    );
  return found;
}
async function cacheExternalExercises(exercises) {
  for (const x of exercises) {
    if (typeof x.id !== 'string' || !x.id || typeof x.name !== 'string')
      continue;
    await prisma.exercise.upsert({
      where: { externalId: x.id },
      update: {},
      create: {
        externalId: x.id,
        catalogId: `api:${x.id}`,
        name: x.name,
        description: x.beschreibung || null,
        targetMuscles: x.targetMuscles || [],
        secondaryMuscles: x.secondaryMuscles || [],
        equipments: x.equipments || [],
        gifUrl: x.gifUrl || null,
      },
    });
  }
}
module.exports = { resolveExercise, cacheExternalExercises };

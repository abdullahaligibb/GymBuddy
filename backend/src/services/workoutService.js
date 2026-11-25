const prisma = require('../lib/prisma');

const VALID_STATUSES = ['GEPLANT', 'ERLEDIGT', 'VERPASST'];

async function getWorkoutsByUser(userId, { date, trainingPlanId } = {}) {
  const where = { userId };
  if (date) where.date = date;
  if (trainingPlanId) where.trainingPlanId = trainingPlanId;

  return prisma.workout.findMany({
    where,
    orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: { exercise: true },
      },
    },
  });
}

async function getWorkoutById(userId, workoutId) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: { exercise: true },
      },
    },
  });

  if (!workout) {
    const error = new Error('Workout nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }

  return workout;
}

async function createWorkout(userId, { name, date, duration, trainingPlanId }) {
  return prisma.workout.create({
    data: {
      name,
      date: date || null,
      duration: duration ? Number(duration) : null,
      trainingPlanId: trainingPlanId || null,
      userId,
    },
    include: {
      exercises: { include: { exercise: true } },
    },
  });
}

async function updateWorkoutStatus(userId, workoutId, status) {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Ungültiger Status. Erlaubt: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Prüfen, ob das Workout existiert und dem User gehört
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
  });

  if (!existing) {
    const error = new Error('Workout nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }

  return prisma.workout.update({
    where: { id: workoutId },
    data: { status },
  });
}

async function deleteWorkout(userId, workoutId) {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
  });

  if (!existing) {
    const error = new Error('Workout nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.workout.delete({ where: { id: workoutId } });
}

async function addExerciseToWorkout(userId, workoutId, exerciseData) {
  // 1. Prüfen, ob Workout dem User gehört
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: { exercises: true },
  });

  if (!workout) {
    const error = new Error('Workout nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }

  const {
    externalId,
    name,
    description,
    targetMuscles = [],
    secondaryMuscles = [],
    equipments = [],
    gifUrl,
    sets,
    reps,
    weight,
    position,
  } = exerciseData;

  // 2. Übung in der DB finden oder neu anlegen (upsert bei ExerciseDB-ID)
  let exercise;
  if (externalId) {
    exercise = await prisma.exercise.upsert({
      where: { externalId: String(externalId) },
      update: {}, // Bereits vorhanden -> nichts überschreiben
      create: {
        externalId: String(externalId),
        name,
        description: description || null,
        targetMuscles,
        secondaryMuscles,
        equipments,
        gifUrl: gifUrl || null,
      },
    });
  } else {
    // Eigene, manuell erstellte Übung des Users
    exercise = await prisma.exercise.create({
      data: {
        name,
        description: description || null,
        targetMuscles,
        secondaryMuscles,
        equipments,
        gifUrl: gifUrl || null,
        userId,
      },
    });
  }

  // 3. Position automatisch ans Ende hängen, falls keine angegeben wurde
  const nextPosition = position ?? workout.exercises.length + 1;

  return prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId: exercise.id,
      position: Number(nextPosition),
      sets: sets != null ? Number(sets) : null,
      reps: reps != null ? Number(reps) : null,
      weight: weight != null ? Number(weight) : null,
    },
    include: { exercise: true },
  });
}

module.exports = {
  getWorkoutsByUser,
  getWorkoutById,
  createWorkout,
  updateWorkoutStatus,
  deleteWorkout,
  addExerciseToWorkout,
};
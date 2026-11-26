const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const dbUrl = process.env.TEST_DATABASE_URL;
if (
  !dbUrl ||
  !new URL(dbUrl).pathname.endsWith('_test') ||
  !['127.0.0.1', 'localhost'].includes(new URL(dbUrl).hostname)
)
  throw new Error(
    'TEST_DATABASE_URL must name an isolated local *_test database.',
  );
process.env.DATABASE_URL = dbUrl;
process.env.DIRECT_URL = dbUrl;
const prisma = require('../src/lib/prisma');
const users = [];
let child, base, source, sourceUrl;
let stderr = '';
const password = 'Integration-2026!';
async function start(databaseUrl = dbUrl) {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      PORT: String(port),
      HOST: '127.0.0.1',
      JWT_SECRET: 'test-only-session-secret-32-characters-minimum',
      EXERCISE_API_URL: sourceUrl,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  child.stderr.on('data', (x) => (stderr += x));
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('API exited: ' + stderr);
    try {
      if ((await fetch(base + '/health')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('API start timeout: ' + stderr);
}
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    const stopping = child;
    child = undefined;
    const done = once(stopping, 'exit');
    stopping.kill();
    await done;
  }
}
async function request(method, url, token, body, expected = 200) {
  const response = await fetch(base + url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
async function account() {
  const id = randomUUID().slice(0, 12);
  const input = {
    username: 'it-' + id,
    email: `it-${id}@example.test`,
    password,
  };
  const result = await request('POST', '/api/auth/register', null, input, 201);
  users.push(result.user.id);
  return { ...result, input };
}
const workout = (extra = {}) => ({
  name: 'Push Training',
  date: '2026-11-23',
  duration: 45,
  time: '18:30',
  status: 'GEPLANT',
  type: 'Push',
  intensity: 'Mittel',
  muscles: ['Brust'],
  notes: 'Notiz behalten',
  sourceTemplateId: 'push-day',
  trainingPlanId: null,
  exercises: [
    {
      catalogId: 'bankdruecken',
      position: 1,
      sets: 3,
      repetitions: '8–12',
      weight: 0,
      restSeconds: 0,
      notes: 'langsam',
    },
    {
      catalogId: 'kabelrudern',
      position: 2,
      sets: 4,
      repetitions: '30 Sek.',
      weight: 12.5,
      restSeconds: 90,
      notes: null,
    },
  ],
  ...extra,
});
before(async () => {
  source = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        data: [
          {
            exerciseId: 'remote-persistence',
            name: 'Remote Press',
            targetMuscles: ['chest'],
            equipments: ['cable'],
            instructions: ['Kontrolliert drücken.'],
          },
        ],
      }),
    );
  });
  source.listen(0, '127.0.0.1');
  await once(source, 'listening');
  sourceUrl = `http://127.0.0.1:${source.address().port}`;
  await start();
});
after(async () => {
  await stop();
  if (users.length)
    await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
  if (source) await new Promise((r) => source.close(r));
});
test('full training survives a real API process restart and a new login', async () => {
  const a = await account();
  const sent = workout();
  const { workout: saved } = await request(
    'PUT',
    '/api/workouts/by-date/' + sent.date,
    a.token,
    sent,
  );
  assert.equal(saved.exercises[0].repetitions, '8–12');
  assert.equal(saved.exercises[0].weight, 0);
  assert.equal(saved.exercises[0].restSeconds, 0);
  assert.equal(saved.exercises[1].repetitions, '30 Sek.');
  assert.equal(saved.exercises[0].exercise.catalogId, 'bankdruecken');
  assert.equal(saved.notes, sent.notes);
  await stop();
  await start();
  const login = await request('POST', '/api/auth/login', null, {
    email: a.input.email,
    password,
  });
  assert.deepEqual(
    (await request('GET', '/api/workouts', login.token)).workouts,
    [saved],
  );
});
test('failed replacements roll back and each account has only one training per date', async () => {
  const a = await account();
  const sent = workout();
  const saved = (
    await request('PUT', '/api/workouts/by-date/' + sent.date, a.token, sent)
  ).workout;
  await request(
    'PUT',
    '/api/workouts/by-date/' + sent.date,
    a.token,
    workout({
      exercises: [
        ...sent.exercises,
        { catalogId: 'does-not-exist', position: 3, sets: 3, repetitions: '8' },
      ],
    }),
    400,
  );
  assert.deepEqual((await request('GET', '/api/workouts', a.token)).workouts, [
    saved,
  ]);
  const reversed = sent.exercises
    .slice()
    .reverse()
    .map((x, i) => ({ ...x, position: i + 1 }));
  const updated = (
    await request(
      'PUT',
      '/api/workouts/by-date/' + sent.date,
      a.token,
      workout({ name: 'Neu', exercises: reversed }),
    )
  ).workout;
  assert.equal(updated.id, saved.id);
  assert.deepEqual(
    updated.exercises.map((x) => x.exercise.catalogId),
    ['kabelrudern', 'bankdruecken'],
  );
  const parallel = await Promise.all(
    [1, 2, 3].map((n) =>
      fetch(base + '/api/workouts/by-date/' + sent.date, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${a.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workout({ name: 'Parallel ' + n })),
      }),
    ),
  );
  assert.ok(parallel.every((x) => [200, 409].includes(x.status)));
  assert.ok(parallel.some((x) => x.ok));
  assert.equal(
    (await request('GET', '/api/workouts', a.token)).workouts.length,
    1,
  );
});
test('account ownership, rest days, invalid inputs and logout are enforced by PostgreSQL-backed routes', async () => {
  const a = await account(),
    b = await account();
  const sent = workout();
  const saved = (
    await request('PUT', '/api/workouts/by-date/' + sent.date, a.token, sent)
  ).workout;
  assert.deepEqual(
    (await request('GET', '/api/workouts', b.token)).workouts,
    [],
  );
  for (const [method, suffix, body] of [
    ['GET', '', undefined],
    ['PATCH', '/status', { status: 'ERLEDIGT' }],
    ['DELETE', '', undefined],
  ])
    await request(
      method,
      '/api/workouts/' + saved.id + suffix,
      b.token,
      body,
      404,
    );
  for (const duration of [0, 601, 1.5, '45'])
    await request(
      'PUT',
      '/api/workouts/by-date/' + sent.date,
      a.token,
      workout({ duration }),
      400,
    );
  await request(
    'PUT',
    '/api/workouts/by-date/2026-02-30',
    a.token,
    workout({ date: '2026-02-30' }),
    400,
  );
  await request(
    'PUT',
    '/api/workouts/by-date/2199-01-01',
    a.token,
    workout({ date: '2199-01-01', status: 'ERLEDIGT' }),
    400,
  );
  const rest = (
    await request(
      'PUT',
      '/api/workouts/by-date/' + sent.date,
      a.token,
      workout({
        duration: 0,
        status: 'RUHE',
        type: 'Rest Day',
        muscles: [],
        exercises: [],
        time: null,
      }),
    )
  ).workout;
  await request(
    'PATCH',
    '/api/workouts/' + rest.id + '/status',
    a.token,
    { status: 'ERLEDIGT' },
    400,
  );
  await request('POST', '/api/auth/logout', a.token, undefined, 204);
  await stop();
  await start();
  await request('GET', '/api/auth/me', a.token, undefined, 401);
  const fresh = await request('POST', '/api/auth/login', null, {
    email: a.input.email,
    password,
  });
  await request(
    'DELETE',
    '/api/workouts/' + rest.id,
    fresh.token,
    undefined,
    204,
  );
  assert.deepEqual(
    (await request('GET', '/api/workouts', fresh.token)).workouts,
    [],
  );
});
test('loaded external exercise IDs and local catalog IDs stay distinct after saving', async () => {
  const a = await account();
  await request('GET', '/api/exercises?limit=25');
  const sent = workout({
    exercises: [
      {
        catalogId: 'api:remote-persistence',
        externalId: 'remote-persistence',
        position: 1,
        sets: 3,
        repetitions: '8-12',
        weight: 0,
        restSeconds: 0,
      },
    ],
  });
  const saved = (
    await request('PUT', '/api/workouts/by-date/' + sent.date, a.token, sent)
  ).workout;
  assert.equal(saved.exercises[0].exercise.catalogId, 'api:remote-persistence');
  assert.equal(saved.exercises[0].exercise.name, 'Remote Press');
  await request(
    'POST',
    '/api/auth/register',
    null,
    { username: 42, email: [], password: {} },
    400,
  );
  await request(
    'POST',
    '/api/auth/register',
    null,
    { username: 'Short', email: 'short@example.test', password: '1234567' },
    400,
  );
});

test('plans, profile and macro values persist after a process restart and stay private', async () => {
  const a = await account(),
    b = await account();
  const plan = {
    id: 'same-client-id',
    name: 'Eigener Plan',
    goal: 'Kraft',
    durationMinutes: 60,
    type: 'Push',
    difficulty: 'Mittel',
    muscles: ['Brust'],
    exercises: [
      {
        exerciseId: 'bankdruecken',
        sets: 3,
        repetitions: '8–12',
        weightKg: 0,
        restSeconds: 0,
        notes: 'sauber',
      },
    ],
  };
  const savedPlan = (
    await request('PUT', '/api/plans/' + plan.id, a.token, plan)
  ).plan;
  const profile = {
    name: 'Testprofil',
    birthDateIso: '2005-01-31',
    heightCm: 180,
    weightKg: 75,
    targetWeightKg: 80,
    targetDateIso: '2027-06-01',
    activityLevel: 'Moderat aktiv',
    primaryGoal: 'Muskelaufbau',
    experienceLevel: 'Mittel',
    weeklyWorkoutGoal: 3,
    preferredTrainingDays: ['Montag', 'Mittwoch', 'Freitag'],
    energyFormula: 'male',
  };
  assert.deepEqual(
    (await request('PUT', '/api/profile', a.token, profile)).profile,
    profile,
  );
  const target = { calories: 2400, protein: 150, carbs: 300, fat: 67 };
  const log = {
    dateIso: '2026-11-23',
    calories: 1000,
    protein: 50,
    carbs: 100,
    fat: 10,
  };
  await request('PUT', '/api/macros/target', a.token, target);
  await request('PUT', '/api/macros/logs/' + log.dateIso, a.token, log);
  await request('PUT', '/api/macros/logs/' + log.dateIso, a.token, {
    ...log,
    protein: 0,
  });
  await stop();
  await start();
  assert.deepEqual((await request('GET', '/api/plans', a.token)).plans, [
    savedPlan,
  ]);
  assert.deepEqual(
    (await request('GET', '/api/profile', a.token)).profile,
    profile,
  );
  assert.deepEqual(
    (await request('GET', '/api/macros/target', a.token)).target,
    target,
  );
  assert.deepEqual((await request('GET', '/api/macros/logs', a.token)).logs, [
    { ...log, protein: 0 },
  ]);
  assert.deepEqual((await request('GET', '/api/plans', b.token)).plans, []);
  assert.equal((await request('GET', '/api/profile', b.token)).profile, null);
  assert.equal(
    (await request('GET', '/api/macros/target', b.token)).target,
    null,
  );
  assert.deepEqual(
    (await request('GET', '/api/macros/logs', b.token)).logs,
    [],
  );
  // Same client-side plan ID is scoped by account; it cannot overwrite another account's plan.
  await request('PUT', '/api/plans/' + plan.id, b.token, {
    ...plan,
    name: 'Konto B',
  });
  await request('DELETE', '/api/plans/' + plan.id, b.token, undefined, 204);
  assert.deepEqual((await request('GET', '/api/plans', a.token)).plans, [
    savedPlan,
  ]);
  const foreignPlan = await prisma.trainingPlan.findFirst({
    where: { userId: a.user.id },
  });
  await request(
    'PUT',
    '/api/workouts/by-date/2026-11-23',
    b.token,
    workout({ trainingPlanId: foreignPlan.id }),
    404,
  );
  await request(
    'PUT',
    '/api/workouts/by-date/2026-11-23',
    a.token,
    workout({ trainingPlanId: plan.id }),
  );
  await request(
    'PUT',
    '/api/plans/' + plan.id,
    a.token,
    {
      ...plan,
      exercises: [{ exerciseId: 'unknown', sets: 3, repetitions: '8' }],
    },
    400,
  );
  assert.deepEqual((await request('GET', '/api/plans', a.token)).plans, [
    savedPlan,
  ]);
  await request(
    'PUT',
    '/api/macros/target',
    a.token,
    { ...target, fat: -1 },
    400,
  );
  await request(
    'PUT',
    '/api/macros/logs/2026-02-30',
    a.token,
    { ...log, dateIso: '2026-02-30' },
    400,
  );
  await request(
    'PUT',
    '/api/profile',
    a.token,
    { ...profile, birthDateIso: '2026-02-30' },
    400,
  );
  await request(
    'PUT',
    '/api/profile',
    a.token,
    { ...profile, weeklyWorkoutGoal: 1.5 },
    400,
  );
  await request('DELETE', '/api/plans/' + plan.id, a.token, undefined, 204);
  assert.equal(
    (await request('GET', '/api/workouts', a.token)).workouts[0].trainingPlanId,
    null,
  );
  await request(
    'DELETE',
    '/api/macros/logs/' + log.dateIso,
    a.token,
    undefined,
    204,
  );
  assert.deepEqual(
    (await request('GET', '/api/macros/logs', a.token)).logs,
    [],
  );
});

test('the actual TypeScript frontend client round-trips all features through Express and PostgreSQL', async () => {
  require('../../frontend/tests/register.cjs');
  const {
    configuredApi,
  } = require('../../frontend/src/services/configuredApi.ts');
  const {
    createEmptyWorkoutDay,
    parseIsoDate,
  } = require('../../frontend/src/domain/calendar.ts');
  const { workoutTemplates } = require('../../frontend/src/data/templates.ts');
  const {
    initialHealthProfile,
  } = require('../../frontend/src/data/profile.ts');
  assert.deepEqual(
    require('../src/data/exercises.json'),
    require('../../frontend/src/data/exercises.ts').exercises,
    'Backend and frontend catalog metadata must agree.',
  );
  const api = configuredApi({ mode: 'server', baseUrl: base }).api;
  assert.equal(api.notice, undefined);
  const id = randomUUID().slice(0, 10);
  const input = {
    username: 'client-' + id,
    email: `client-${id}@example.test`,
    password,
  };
  const session = await api.register(input);
  users.push(session.user.id);
  const plan = { ...workoutTemplates[0], id: 'client-plan', isCustom: true };
  const savedPlan = await api.savePlan(session.token, plan);
  assert.equal(savedPlan.name, plan.name);
  const day = {
    ...createEmptyWorkoutDay(parseIsoDate('2026-11-23')),
    title: plan.name,
    time: '18:30',
    durationMinutes: plan.durationMinutes,
    type: plan.type,
    intensity: plan.difficulty,
    muscles: plan.muscles,
    status: 'geplant',
    exercises: plan.exercises,
    trainingPlanId: plan.id,
  };
  const saved = await api.saveWorkout(session.token, day);
  assert.equal(saved.trainingPlanId, plan.id);
  assert.deepEqual(
    saved.exercises.map((x) => x.exerciseId),
    plan.exercises.map((x) => x.exerciseId),
  );
  const profile = {
    ...initialHealthProfile,
    birthDateIso: '2005-01-01',
    targetDateIso: '2027-07-01',
  };
  assert.deepEqual(await api.saveProfile(session.token, profile), profile);
  const target = { calories: 2100, protein: 140, carbs: 250, fat: 60 };
  await api.saveMacroTarget(session.token, target);
  await api.saveMacroLog(session.token, { ...target, dateIso: day.dateIso });
  await stop();
  await start();
  const restored = configuredApi({ mode: 'server', baseUrl: base }).api;
  const login = await restored.login(input);
  assert.equal((await restored.listWorkouts(login.token))[0].id, saved.id);
  assert.equal((await restored.listPlans(login.token))[0].id, plan.id);
  assert.deepEqual(await restored.getProfile(login.token), profile);
  assert.deepEqual(await restored.getMacroTarget(login.token), target);
  assert.equal(
    (await restored.listMacroLogs(login.token))[0].dateIso,
    day.dateIso,
  );
  await restored.logout(login.token);
  await assert.rejects(
    () => restored.me(login.token),
    (error) => error.status === 401,
  );
});

test('a database failure after deleting associations rolls the complete replacement back', async () => {
  const a = await account();
  const sent = workout();
  const saved = (
    await request('PUT', '/api/workouts/by-date/' + sent.date, a.token, sent)
  ).workout;
  await prisma.$executeRawUnsafe(
    `CREATE FUNCTION gymbuddy_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.notes = 'force-db-failure' THEN RAISE EXCEPTION 'injected test failure'; END IF; RETURN NEW; END $$`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER gymbuddy_test_failure BEFORE INSERT ON "WorkoutExercise" FOR EACH ROW EXECUTE FUNCTION gymbuddy_test_failure()`,
  );
  try {
    await request(
      'PUT',
      '/api/workouts/by-date/' + sent.date,
      a.token,
      {
        ...sent,
        name: 'Nicht übernehmen',
        exercises: sent.exercises.map((x) => ({
          ...x,
          notes: 'force-db-failure',
        })),
      },
      500,
    );
    assert.deepEqual(
      (await request('GET', '/api/workouts', a.token)).workouts,
      [saved],
    );
  } finally {
    await prisma.$executeRawUnsafe(
      'DROP TRIGGER gymbuddy_test_failure ON "WorkoutExercise"',
    );
    await prisma.$executeRawUnsafe('DROP FUNCTION gymbuddy_test_failure()');
  }
});

test(
  'PostgreSQL restart and a dump restored into a different database retain complete records',
  { skip: !process.env.TEST_POSTGRES_CONTAINER },
  async () => {
    const { execFileSync } = require('node:child_process');
    const container = process.env.TEST_POSTGRES_CONTAINER;
    const connection = new URL(dbUrl),
      username = decodeURIComponent(connection.username),
      database = connection.pathname.slice(1);
    const restoreName = 'gymbuddy_restore_' + Date.now() + '_test',
      dump = '/tmp/' + restoreName + '.dump';
    const docker = (...argv) =>
      execFileSync('docker', ['exec', container, ...argv], { stdio: 'pipe' });
    const a = await account();
    const sent = workout();
    const saved = (
      await request('PUT', '/api/workouts/by-date/' + sent.date, a.token, sent)
    ).workout;
    const restore = new URL(dbUrl);
    restore.pathname = '/' + restoreName;
    let created = false;
    try {
      docker(
        'pg_dump',
        '-U',
        username,
        '--format=custom',
        '--file=' + dump,
        database,
      );
      docker('createdb', '-U', username, restoreName);
      created = true;
      docker(
        'pg_restore',
        '-U',
        username,
        '--exit-on-error',
        '--dbname=' + restoreName,
        dump,
      );
      await stop();
      await start(restore.toString());
      const login = await request('POST', '/api/auth/login', null, {
        email: a.input.email,
        password,
      });
      assert.deepEqual(
        (await request('GET', '/api/workouts', login.token)).workouts,
        [saved],
      );
      await stop();
      await prisma.$disconnect();
      execFileSync('docker', ['restart', container], { stdio: 'pipe' });
      for (let i = 0; i < 60; i++) {
        try {
          docker('pg_isready', '-U', username);
          break;
        } catch {}
        await new Promise((r) => setTimeout(r, 250));
      }
      await start();
      assert.deepEqual(
        (await request('GET', '/api/workouts', a.token)).workouts,
        [saved],
      );
    } finally {
      await stop();
      if (created) docker('dropdb', '-U', username, '--force', restoreName);
      docker('rm', '-f', dump);
      await start();
    }
  },
);

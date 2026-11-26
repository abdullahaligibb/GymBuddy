const { HttpError } = require('./errors');
const fail = (message = 'Ungültige Eingaben.') => {
  throw new HttpError(400, message);
};
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  return value;
}
function text(value, min = 1, max = 500) {
  if (
    typeof value !== 'string' ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail();
  return value.trim();
}
function number(value, min, max, integer = false) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    fail();
  return value;
}
function oneOf(value, values) {
  if (!values.includes(value)) fail();
  return value;
}
function date(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '1900-01-01' ||
    value > '2200-12-31'
  )
    fail('Ungültiges Kalenderdatum.');
  const d = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(d.valueOf()) || d.toISOString().slice(0, 10) !== value)
    fail('Ungültiges Kalenderdatum.');
  return value;
}
const muscles = [
  'Bauch',
  'Beine',
  'Bizeps',
  'Brust',
  'Ganzkörper',
  'Gesäß',
  'Rücken',
  'Schulter',
  'Trizeps',
  'Waden',
  'Cardio',
  'Regeneration',
];
const types = [
  'Push',
  'Pull',
  'Legs',
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Cardio',
  'Mobility',
  'Rest Day',
];
const intensities = ['Leicht', 'Mittel', 'Schwer'];
function strings(value, allowed, min = 0, max = 50) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail();
  const result = value.map((x) =>
    allowed ? oneOf(x, allowed) : text(x, 1, 100),
  );
  if (new Set(result).size !== result.length) fail();
  return result;
}
const optionalText = (x, max = 500) => (x == null ? null : text(x, 0, max));
const optionalNumber = (x, min, max, integer = false) =>
  x == null ? null : number(x, min, max, integer);
function prescriptions(rows, plan = false) {
  if (!Array.isArray(rows) || rows.length > 100) fail();
  const seen = new Set();
  return rows.map((raw, i) => {
    const row = object(raw);
    const catalogId = text(plan ? row.exerciseId : row.catalogId, 1, 200);
    if (seen.has(catalogId)) fail('Übung ist doppelt zugeordnet.');
    seen.add(catalogId);
    if (!plan && row.position !== i + 1) fail('Ungültige Übungsreihenfolge.');
    if (
      row.externalId != null &&
      (typeof row.externalId !== 'string' ||
        catalogId !== `api:${row.externalId}`)
    )
      fail('Ungültige Katalogreferenz.');
    return {
      catalogId,
      position: i + 1,
      sets: number(row.sets, 1, 100, true),
      repetitions: text(row.repetitions, 1, 50),
      weight: optionalNumber(plan ? row.weightKg : row.weight, 0, 1000),
      restSeconds: optionalNumber(row.restSeconds, 0, 3600, true),
      notes: optionalText(row.notes),
    };
  });
}
function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIME_ZONE || 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day']
    .map((key) => parts.find((x) => x.type === key).value)
    .join('-');
}
function workout(value, pathDate) {
  const x = object(value);
  const day = date(pathDate);
  if (x.date !== day) fail('Datum und Anfragepfad stimmen nicht überein.');
  const status = oneOf(x.status, ['GEPLANT', 'ERLEDIGT', 'VERPASST', 'RUHE']);
  const type = oneOf(x.type, types);
  const rest = status === 'RUHE';
  if (rest !== (type === 'Rest Day'))
    fail('Ruhetag und Trainingsart stimmen nicht überein.');
  if (day > today() && ['ERLEDIGT', 'VERPASST'].includes(status))
    fail('Zukünftige Trainings bleiben geplant.');
  const exercises = prescriptions(x.exercises);
  const selected = strings(x.muscles, muscles, rest ? 0 : 1);
  const duration = number(x.duration, rest ? 0 : 1, rest ? 0 : 600, true);
  if (rest && (exercises.length || selected.length))
    fail('Ein Ruhetag hat keine Übungen oder Muskelgruppen.');
  if (
    x.time != null &&
    (typeof x.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time))
  )
    fail('Ungültige Uhrzeit.');
  return {
    name: text(x.name, 1, 60),
    date: day,
    duration,
    time: x.time ?? null,
    status,
    type,
    intensity: oneOf(x.intensity, intensities),
    muscles: selected,
    notes: optionalText(x.notes, 2000),
    sourceTemplateId: optionalText(x.sourceTemplateId, 200),
    trainingPlanId: optionalText(x.trainingPlanId, 200),
    exercises,
  };
}
module.exports = {
  fail,
  object,
  text,
  number,
  oneOf,
  date,
  strings,
  optionalText,
  optionalNumber,
  prescriptions,
  today,
  workout,
  muscles,
  types,
  intensities,
};

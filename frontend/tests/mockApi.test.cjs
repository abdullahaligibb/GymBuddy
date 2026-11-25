const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMockApi, demoLogin } = require('../src/services/mockApi.ts');

test('mock accounts are isolated, expired tokens are rejected and failures leave data unchanged', async () => {
  let now = new Date(2026, 0, 5, 12);
  let fail = true;
  const api = createMockApi({
    now: () => now,
    before: (method) => {
      if (method === 'saveMacroLog' && fail) throw new Error('offline');
    },
  });
  const a = await api.register({ username: 'Alpha', email: 'a@example.test', password: 'test1234' });
  const b = await api.register({ username: 'Bravo', email: 'b@example.test', password: 'test1234' });
  const log = { dateIso: '2026-01-05', calories: 1200, protein: 100, carbs: 110, fat: 40 };
  await assert.rejects(api.saveMacroLog(a.token, log), /offline/);
  assert.deepEqual(await api.listMacroLogs(a.token), []);
  fail = false;
  await api.saveMacroLog(a.token, log);
  assert.deepEqual(await api.listMacroLogs(b.token), []);
  assert.equal((await api.listMacroLogs(a.token))[0].protein, 100);
  await api.logout(b.token);
  await assert.rejects(api.me(b.token), { status: 401 });
  now = new Date(2026, 0, 6, 13);
  await assert.rejects(api.me(a.token), { status: 401 });
});

test('an unexpired demo session can be checked on startup and logout revokes it in the mock', async () => {
  let now = new Date(2026, 0, 5, 12);
  const api = createMockApi({ now: () => now });
  const demo = await api.login(demoLogin);
  const restarted = createMockApi({ now: () => now });
  assert.equal((await restarted.me(demo.token)).username, 'Arion');
  await restarted.logout(demo.token);
  await assert.rejects(restarted.me(demo.token), { status: 401 });
  now = new Date(2026, 0, 6, 13);
  await assert.rejects(api.me(demo.token), { status: 401 });
});

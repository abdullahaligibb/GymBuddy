const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMockApi } = require('../src/services/mockApi.ts');

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

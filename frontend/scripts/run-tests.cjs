const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tests = fs.readdirSync(path.join(root, 'tests')).filter((name) => name.endsWith('.test.cjs')).map((name) => path.join(root, 'tests', name));
const result = spawnSync(process.execPath, ['--require', path.join(root, 'tests/register.cjs'), '--test', ...tests], { stdio: 'inherit', cwd: root });
if (result.error) throw result.error;
process.exit(result.status ?? 1);

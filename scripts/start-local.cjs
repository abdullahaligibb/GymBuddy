const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomBytes } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const hostIndex = args.indexOf('--host');
const addresses = Object.values(os.networkInterfaces())
  .flat()
  .filter(
    (x) =>
      x &&
      x.family === 'IPv4' &&
      !x.internal &&
      !x.address.startsWith('169.254.') &&
      !x.address.startsWith('172.'),
  );
const host =
  hostIndex >= 0 ? args[hostIndex + 1] : addresses[0]?.address || '127.0.0.1';
if (!host || !/^(localhost|\d{1,3}(?:\.\d{1,3}){3})$/.test(host))
  throw new Error('--host benötigt die IPv4-Adresse dieses Rechners.');
function run(command, argv, cwd = root) {
  const result = spawnSync(command, argv, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error || result.status !== 0)
    throw new Error(`${command} ist fehlgeschlagen.`);
}
function npmCi(folder) {
  const npmCli =
    process.env.npm_execpath ||
    [
      path.join(
        path.dirname(process.execPath),
        'node_modules/npm/bin/npm-cli.js',
      ),
      path.resolve(
        path.dirname(process.execPath),
        '../node_modules/npm/bin/npm-cli.js',
      ),
    ].find(fs.existsSync);
  if (!npmCli)
    throw new Error('Bitte über npm run setup oder npm run dev starten.');
  run(process.execPath, [npmCli, 'ci', '--no-fund', '--no-audit'], folder);
}
function readEnv(file) {
  return fs.existsSync(file)
    ? Object.fromEntries(
        fs
          .readFileSync(file, 'utf8')
          .split(/\r?\n/)
          .map((x) => x.replace(/^\uFEFF/, ''))
          .filter((x) => /^[A-Z_]+=/.test(x))
          .map((x) => {
            const i = x.indexOf('=');
            return [x.slice(0, i), x.slice(i + 1)];
          }),
      )
    : {};
}
function updateEnv(file, values) {
  const existing = fs.existsSync(file)
    ? fs
        .readFileSync(file, 'utf8')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
    : [];
  const keys = new Set(Object.keys(values));
  const lines = existing.filter(
    (line) => !keys.has(line.slice(0, line.indexOf('='))),
  );
  fs.writeFileSync(
    file,
    [
      ...lines.filter(Boolean),
      ...Object.entries(values).map(([key, value]) => `${key}=${value}`),
      '',
    ].join('\n'),
  );
}
async function main() {
  const localFile = path.join(root, '.env.local');
  let local = readEnv(localFile);
  if (!local.GYMBUDDY_DB_PASSWORD) {
    updateEnv(localFile, {
      GYMBUDDY_DB_PASSWORD: randomBytes(32).toString('hex'),
    });
    local = readEnv(localFile);
  }
  const backend = path.join(root, 'backend'),
    frontend = path.join(root, 'frontend');
  const backendFile = path.join(backend, '.env');
  const current = readEnv(backendFile);
  const dbUrl = `postgresql://gymbuddy:${encodeURIComponent(local.GYMBUDDY_DB_PASSWORD)}@127.0.0.1:55433/gymbuddy_dev?schema=public`;
  if (current.DATABASE_URL && current.DATABASE_URL !== dbUrl)
    throw new Error(
      'backend/.env enthält bereits eine andere Datenbank. Diese wird nicht überschrieben. Für den bestehenden Server die manuelle Startanleitung verwenden.',
    );
  updateEnv(backendFile, {
    DATABASE_URL: dbUrl,
    DIRECT_URL: dbUrl,
    JWT_SECRET: current.JWT_SECRET || randomBytes(48).toString('hex'),
    PORT: '3000',
    HOST: '0.0.0.0',
  });
  updateEnv(path.join(frontend, '.env'), {
    EXPO_PUBLIC_API_MODE: 'server',
    EXPO_PUBLIC_API_CONTRACT: 'v1',
    EXPO_PUBLIC_API_URL: `http://${host}:3000`,
  });
  run('docker', [
    'compose',
    '--project-name',
    'gymbuddy',
    '--env-file',
    localFile,
    'up',
    '--detach',
    '--wait',
    'database',
  ]);
  for (const dir of [backend, frontend])
    if (!fs.existsSync(path.join(dir, 'node_modules'))) npmCi(dir);
  const prisma = path.join(backend, 'node_modules/prisma/build/index.js');
  run(process.execPath, [prisma, 'generate'], backend);
  run(process.execPath, [prisma, 'migrate', 'deploy'], backend);
  console.log(`Serveradresse für Handys: http://${host}:3000`);
  console.log(`App im Browser: http://${host}:8091`);
  if (args.includes('--setup-only')) return;
  const api = spawn(process.execPath, ['server.js'], {
    cwd: backend,
    stdio: 'inherit',
  });
  let app;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch('http://127.0.0.1:3000/health')).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready)
      throw new Error(
        'API nicht erreichbar. Prüfe, ob Port 3000 bereits verwendet wird.',
      );
    app = spawn(
      process.execPath,
      [
        path.join(frontend, 'node_modules/expo/bin/cli'),
        'start',
        '--web',
        '--lan',
        '--port',
        '8091',
      ],
      {
        cwd: frontend,
        stdio: 'inherit',
        env: { ...process.env, BROWSER: 'none' },
      },
    );
    const stop = () => {
      for (const child of [app, api])
        if (child && child.exitCode === null) {
          if (process.platform === 'win32')
            spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
              stdio: 'ignore',
            });
          else child.kill('SIGTERM');
        }
    };
    process.on('SIGINT', () => {
      stop();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      stop();
      process.exit(0);
    });
    api.on('error', stop);
    app.on('error', stop);
    api.on('exit', stop);
    app.on('exit', stop);
  } catch (error) {
    api.kill();
    throw error;
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

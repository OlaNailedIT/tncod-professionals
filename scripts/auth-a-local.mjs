import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile, stat, writeFile } from 'node:fs/promises';

const input = JSON.parse(await new Promise(resolve => {
  let data = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', part => { data += part; });
  process.stdin.on('end', () => resolve(data));
}));
for (const [name, port] of [['API_URL', '54321'], ['DB_URL', '54322'], ['MAILPIT_URL', '54324']]) {
  const url = new URL(input[name]);
  if (url.hostname !== '127.0.0.1' || url.port !== port) throw new Error(`Refused non-disposable ${name}`);
}
if (!input.PUBLISHABLE_KEY?.startsWith('sb_publishable_') || !input.SECRET_KEY?.startsWith('sb_secret_')) {
  throw new Error('Modern local keys required');
}
const consumers = input.proofCase === 'consumers';
if (!consumers) await new Promise((resolve, reject) => {
  const probe = createServer(); probe.once('error', () => reject(new Error('Port 3000 is occupied; no existing server will be reused or stopped')));
  probe.listen(3000, '127.0.0.1', () => probe.close(resolve));
});
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(NEXT_PUBLIC_SUPABASE_|SUPABASE_|DATABASE_URL$|DIRECT_URL$|AUTH_E2E_HELPER$)/.test(key)) delete env[key];
}
Object.assign(env, {
  SUPABASE_AUTH_SERVER_ONLY: '1', SUPABASE_URL: input.API_URL,
  SUPABASE_PUBLISHABLE_KEY: input.PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY: input.SECRET_KEY,
  DATABASE_URL: input.DB_URL, DIRECT_URL: input.DB_URL, MAILPIT_URL: input.MAILPIT_URL,
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000', PHASE4_DISPOSABLE_AUTH_TESTS: '1',
  AUTH_E2E_HELPER: '0', NEXT_TELEMETRY_DISABLED: '1',
});
if (consumers) {
  try {
    const prior = JSON.parse(await readFile('.cache/auth-a/local-consumers.json', 'utf8'));
    await writeFile(`.cache/auth-a/local-consumers-${prior.at.replaceAll(/[:.]/g, '-')}.json`, JSON.stringify(prior, null, 2));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log('Running actual domain/Storage credential consumers; no browser/email acceptance claimed.');
} else if (input.reuseBuild) {
  const prior = JSON.parse(await readFile('.cache/auth-a/local-application.json', 'utf8'));
  const build = await stat('.next/BUILD_ID');
  if (!prior.completed || prior.failed !== 0 || prior.auth !== '127.0.0.1:54321' || build.mtimeMs > Date.parse(prior.at)) {
    throw new Error('No previously verified local build available for reuse');
  }
  await writeFile(`.cache/auth-a/local-application-${prior.at.replaceAll(/[:.]/g, '-')}.json`, JSON.stringify(prior, null, 2));
  console.log('Reusing the previously verified local build; browser proof will re-check the real boundaries.');
} else {
const buildCode = await new Promise(resolve => {
  const build = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    env: { ...env, NODE_ENV: 'production' }, stdio: 'inherit',
  });
  build.once('error', () => resolve(-1)); build.once('exit', resolve);
});
if (buildCode !== 0) throw new Error('Local production build failed; browser proof not started');
}
const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run',
  consumers ? 'src/features/business/server-only-key.disposable.integration.test.ts' : 'src/lib/env/server-only-auth.disposable.integration.test.ts', '--configLoader', 'runner', '--no-cache'], {
  env, stdio: 'inherit',
});
child.once('error', () => { console.error('Could not start local proof'); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });

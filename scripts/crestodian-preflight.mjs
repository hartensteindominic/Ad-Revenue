import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = ['package.json', 'README.md', 'app', 'contracts', 'scripts'];
const forbiddenNames = ['.env', '.env.local', '.env.production'];

const missing = required.filter((entry) => !fs.existsSync(path.join(root, entry)));
const leakedEnvFiles = forbiddenNames.filter((entry) => fs.existsSync(path.join(root, entry)));

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const requiredScripts = ['build', 'test:release', 'chain:compile'];
const missingScripts = requiredScripts.filter((name) => !packageJson.scripts?.[name]);

const checks = [
  ['repository shape', missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : 'ok'],
  ['secret files absent', leakedEnvFiles.length === 0, leakedEnvFiles.length ? `found: ${leakedEnvFiles.join(', ')}` : 'ok'],
  ['release scripts present', missingScripts.length === 0, missingScripts.length ? `missing: ${missingScripts.join(', ')}` : 'ok'],
];

let failed = false;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
  if (!ok) failed = true;
}

console.log('\nCrestodian preflight: ' + (failed ? 'BLOCKED' : 'READY'));
console.log('This preflight does not deploy, sign transactions, mutate production secrets, or prove receipt authenticity.');

process.exitCode = failed ? 1 : 0;

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const temp = await mkdtemp(join(tmpdir(), 'voxel-vault-proximity-'));
await mkdir(join(temp, 'lib'), { recursive: true });
await writeFile(join(temp, 'package.json'), '{"type":"module"}\n');
await writeFile(join(temp, 'lib', 'proximity.js'), await readFile(new URL('lib/proximity.js', root), 'utf8'));

const proximity = await import(pathToFileURL(join(temp, 'lib', 'proximity.js')).href);
const now = Date.parse('2026-08-20T12:00:00.000Z');
const intent = proximity.createProximityIntent({ dropId: 'drop-1', nonce: 'nonce-1' });
intent.createdAt = new Date(now).toISOString();

const parsed = proximity.parseProximityIntent(intent, { now });
assert.equal(parsed.dropId, 'drop-1');
assert.equal(parsed.action, 'discover');
assert.equal(parsed.nonce, 'nonce-1');

console.log('Voxel Vault proximity smoke tests passed.');

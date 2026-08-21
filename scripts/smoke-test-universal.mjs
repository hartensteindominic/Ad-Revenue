import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const temp = await mkdtemp(join(tmpdir(), 'voxel-vault-engine-'));
const libDir = join(temp, 'lib');
const generationDir = join(libDir, 'generation');
await mkdir(generationDir, { recursive: true });
await writeFile(join(temp, 'package.json'), '{"type":"module"}\n');

const copy = async (source, target) => writeFile(target, await readFile(new URL(source, root), 'utf8'));
await copy('lib/universalCollectible.js', join(libDir, 'universalCollectible.js'));
await copy('lib/generation/realisticRules.js', join(generationDir, 'realisticRules.js'));
await copy('lib/dropEngine.js', join(libDir, 'dropEngine.js'));
await copy('lib/tradingEngine.js', join(libDir, 'tradingEngine.js'));
await copy('lib/claimAuthority.js', join(libDir, 'claimAuthority.js'));

const normalizeLocalImports = async (file) => {
  const target = join(temp, file);
  const text = await readFile(target, 'utf8');
  const normalized = text.replace(/(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g, (match, prefix, specifier, suffix) => {
    if (/\.[a-z]+$/i.test(specifier)) return match;
    return `${prefix}${specifier}.js${suffix}`;
  });
  await writeFile(target, normalized);
};
await normalizeLocalImports('lib/generation/realisticRules.js');
await normalizeLocalImports('lib/dropEngine.js');

const collectible = await import(pathToFileURL(join(libDir, 'universalCollectible.js')).href);
const generation = await import(pathToFileURL(join(generationDir, 'realisticRules.js')).href);
const drops = await import(pathToFileURL(join(libDir, 'dropEngine.js')).href);
const trading = await import(pathToFileURL(join(libDir, 'tradingEngine.js')).href);
const authority = await import(pathToFileURL(join(libDir, 'claimAuthority.js')).href);

const camera = collectible.createUniversalCollectible({
  name: 'Field Camera', family: 'technology', subtype: 'camera', creationMode: 'procedural',
  seed: 'camera-001', rarity: 'rare', realityBasis: { inspiredBy: 'vintage field camera', plausibility: 'realistic' },
});
const robot = collectible.createUniversalCollectible({ name: 'Survey Robot', family: 'technology', subtype: 'robot', seed: 'robot-001' });
const skateboard = collectible.createUniversalCollectible({ name: 'Street Deck', family: 'sports', subtype: 'skateboard', seed: 'board-001' });

for (const item of [camera, robot, skateboard]) {
  assert.equal(collectible.validateUniversalCollectible(item).valid, true);
  assert.equal(collectible.collectibleFingerprint(item).length, 16);
}
assert.notEqual(collectible.collectibleFingerprint(camera), collectible.collectibleFingerprint(robot));
assert.equal(generation.validateGenerationRequest({ family: 'technology', rarity: 'rare', quantity: 3 }).valid, true);
assert.equal(generation.validateGenerationRequest({ family: 'not-a-family' }).valid, false);

assert.throws(() => drops.createDrop({ startAt: 'not-a-date' }), /startAt must be a valid date/);
assert.throws(() => drops.createDrop({ startAt: '2026-08-20T13:00:00.000Z', endAt: '2026-08-20T12:00:00.000Z' }), /endAt must be later/);

const now = new Date();
const startAt = new Date(now.getTime() - 60_000).toISOString();
const endAt = new Date(now.getTime() + 60 * 60_000).toISOString();
const drop = drops.createDrop({ id: 'drop-1', name: 'Test Drop', status: 'active', startAt, endAt, radiusMeters: 100, quantity: 2 });
assert.equal(drops.isDropDiscoverable(drop, now), true);
assert.equal(drops.isWithinDropZone(drop, 99), true);
assert.equal(drops.isWithinDropZone(drop, 101), false);

authority.seedMemoryDrop({ ...drop, claimedCount: 0, collectible: camera });
const auth1 = await authority.authorizeClaim({ dropId: 'drop-1', walletAddress: '0xABC', distanceMeters: 50 });
assert.equal(auth1.authorized, true);
assert.equal(auth1.ownershipGranted === true, false);
assert.ok(auth1.claimTicket);
assert.equal(auth1.security.ownership.includes('not-granted'), true);

const auth2 = await authority.authorizeClaim({ dropId: 'drop-1', walletAddress: '0xABC', distanceMeters: 50 });
assert.equal(auth2.authorized, false);
assert.equal(auth2.reason, 'already_claimed');

const offer = trading.createTradeOffer({ offerer: '0xAAA', recipient: '0xBBB', offered: [camera], requested: [robot], expiresAt: new Date(now.getTime() + 60 * 60_000).toISOString() });
assert.equal(trading.canAcceptTrade(offer, '0xbbb', now), true);
const accepted = trading.transitionTrade(offer, 'accepted', now);
assert.equal(accepted.state, 'accepted');
const expired = trading.transitionTrade({ ...offer, state: 'pending' }, 'expired', new Date(now.getTime() + 2 * 60 * 60_000));
assert.equal(expired.state, 'expired');
assert.equal(trading.canAcceptTrade(offer, '0xbbb', new Date(now.getTime() + 2 * 60 * 60_000)), false);

console.log('Voxel Vault universal engine + claim authority smoke tests passed.');

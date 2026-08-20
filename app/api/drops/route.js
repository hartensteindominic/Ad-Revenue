import { NextResponse } from 'next/server';
import { createDrop } from '../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../lib/universalCollectible';
import { listDrops, upsertDrop, seedMemoryDrop } from '../../../lib/claimAuthority';

// Seed the three vertical-slice drops into memory when DB is empty.
const SEED = [
  {
    id: 'drop-field-camera-001',
    name: 'Field Camera Drop',
    status: 'active',
    quantity: 25,
    publicZoneId: 'central-park-south',
    radiusMeters: 120,
    lat: 40.7648,
    lng: -73.9808,
    startAt: new Date(Date.now() - 86400000).toISOString(),
    endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    collectible: createUniversalCollectible({
      name: 'Field Camera',
      family: 'technology',
      subtype: 'camera',
      rarity: 'rare',
      seed: 'camera-001',
      realityBasis: { inspiredBy: 'vintage field camera', plausibility: 'realistic' },
    }),
  },
  {
    id: 'drop-survey-robot-001',
    name: 'Survey Robot Drop',
    status: 'active',
    quantity: 10,
    publicZoneId: 'union-square',
    radiusMeters: 90,
    lat: 40.7359,
    lng: -73.9911,
    startAt: new Date(Date.now() - 3600000).toISOString(),
    endAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    collectible: createUniversalCollectible({
      name: 'Survey Robot',
      family: 'technology',
      subtype: 'robot',
      rarity: 'epic',
      seed: 'robot-001',
      realityBasis: { inspiredBy: 'industrial inspection robot', plausibility: 'realistic' },
    }),
  },
  {
    id: 'drop-street-deck-001',
    name: 'Street Deck Drop',
    status: 'active',
    quantity: 40,
    publicZoneId: 'venice-boardwalk',
    radiusMeters: 150,
    lat: 33.985,
    lng: -118.4695,
    startAt: new Date(Date.now() - 7200000).toISOString(),
    endAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    collectible: createUniversalCollectible({
      name: 'Street Deck',
      family: 'sports',
      subtype: 'skateboard',
      rarity: 'uncommon',
      seed: 'board-001',
      realityBasis: { inspiredBy: 'modern skateboard', plausibility: 'realistic' },
    }),
  },
];

function ensureSeeds() {
  for (const raw of SEED) {
    const drop = createDrop({
      id: raw.id,
      name: raw.name,
      status: raw.status,
      quantity: raw.quantity,
      publicZoneId: raw.publicZoneId,
      radiusMeters: raw.radiusMeters,
      startAt: raw.startAt,
      endAt: raw.endAt,
    });
    seedMemoryDrop({
      ...drop,
      lat: raw.lat,
      lng: raw.lng,
      collectible: raw.collectible,
      claimedCount: 0,
    });
  }
}

export async function GET() {
  try {
    ensureSeeds();
    const drops = await listDrops();
    if (!drops.length) {
      // Ensure seeds are visible even on cold memory
      ensureSeeds();
      return NextResponse.json({ drops: await listDrops(), storage: 'memory-seed' });
    }
    return NextResponse.json({ drops, storage: 'server' });
  } catch (error) {
    console.error('list drops failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to list drops' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const drop = createDrop({
      id: body.id || `drop-${Date.now().toString(36)}`,
      name: body.name,
      status: body.status || 'active',
      quantity: body.quantity,
      publicZoneId: body.publicZoneId || 'user-public-zone',
      radiusMeters: body.radiusMeters,
      startAt: body.startAt || new Date().toISOString(),
      endAt: body.endAt || new Date(Date.now() + 2 * 86400000).toISOString(),
    });
    const collectible = body.collectible
      ? body.collectible
      : createUniversalCollectible({
          name: body.name || 'Local Collectible',
          family: body.family || 'other',
          subtype: body.subtype || 'object',
          rarity: body.rarity || 'common',
          seed: drop.id,
        });
    const saved = await upsertDrop({
      ...drop,
      lat: body.lat,
      lng: body.lng,
      collectible,
      claimedCount: 0,
    });
    return NextResponse.json({ drop: saved, note: 'Drop stored. Claims require /api/drops/claim.' });
  } catch (error) {
    console.error('create drop failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to create drop' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { createDrop } from '../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../lib/universalCollectible';
import { listDrops, upsertDrop, seedMemoryDrop } from '../../../lib/claimAuthority';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_ID_LENGTH = 128;

// Demo seeds are only an in-memory development fallback. Production persistence is handled by Supabase.
const SEED = [
  {
    id: 'drop-field-camera-001', name: 'Field Camera Drop', status: 'active', quantity: 25,
    publicZoneId: 'central-park-south', radiusMeters: 120, lat: 40.7648, lng: -73.9808,
    startAt: new Date(Date.now() - 86400000).toISOString(), endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    collectible: createUniversalCollectible({ name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001', realityBasis: { inspiredBy: 'vintage field camera', plausibility: 'realistic' } }),
  },
  {
    id: 'drop-survey-robot-001', name: 'Survey Robot Drop', status: 'active', quantity: 10,
    publicZoneId: 'union-square', radiusMeters: 90, lat: 40.7359, lng: -73.9911,
    startAt: new Date(Date.now() - 3600000).toISOString(), endAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    collectible: createUniversalCollectible({ name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001', realityBasis: { inspiredBy: 'industrial inspection robot', plausibility: 'realistic' } }),
  },
  {
    id: 'drop-street-deck-001', name: 'Street Deck Drop', status: 'active', quantity: 40,
    publicZoneId: 'venice-boardwalk', radiusMeters: 150, lat: 33.985, lng: -118.4695,
    startAt: new Date(Date.now() - 7200000).toISOString(), endAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    collectible: createUniversalCollectible({ name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001', realityBasis: { inspiredBy: 'modern skateboard', plausibility: 'realistic' } }),
  },
];

function ensureSeeds() {
  for (const raw of SEED) {
    const drop = createDrop({ id: raw.id, name: raw.name, status: raw.status, quantity: raw.quantity, publicZoneId: raw.publicZoneId, radiusMeters: raw.radiusMeters, startAt: raw.startAt, endAt: raw.endAt });
    seedMemoryDrop({ ...drop, lat: raw.lat, lng: raw.lng, collectible: raw.collectible, claimedCount: 0 });
  }
}

function productionAdminConfigured() {
  return process.env.NODE_ENV !== 'production' || Boolean(process.env.VOXEL_DROP_ADMIN_KEY);
}

function authorizedMutation(request) {
  if (process.env.NODE_ENV !== 'production') return true;
  const configured = process.env.VOXEL_DROP_ADMIN_KEY;
  const header = request.headers.get('authorization') || '';
  return Boolean(configured && header === `Bearer ${configured}`);
}

export async function GET() {
  try {
    ensureSeeds();
    const drops = await listDrops();
    if (!drops.length && process.env.NODE_ENV !== 'production') {
      ensureSeeds();
      return NextResponse.json({ drops: await listDrops(), storage: 'memory-seed' });
    }
    return NextResponse.json({ drops, storage: 'server' }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (error) {
    console.error('list drops failed', error?.message || error);
    return NextResponse.json({ error: 'Unable to list drops' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!productionAdminConfigured() || !authorizedMutation(request)) {
      return NextResponse.json({ error: 'Drop creation is protected and is not enabled for unauthenticated production requests.' }, { status: 401 });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Drop payload is too large.' }, { status: 413 });

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (id && id.length > MAX_ID_LENGTH) return NextResponse.json({ error: 'Drop id is too long.' }, { status: 400 });
    if (!name || name.length > MAX_NAME_LENGTH) return NextResponse.json({ error: 'A valid drop name is required.' }, { status: 400 });

    const drop = createDrop({
      id: id || `drop-${crypto.randomUUID()}`,
      name,
      status: body.status || 'draft',
      quantity: body.quantity,
      publicZoneId: body.publicZoneId || 'user-public-zone',
      radiusMeters: body.radiusMeters,
      startAt: body.startAt || new Date().toISOString(),
      endAt: body.endAt || new Date(Date.now() + 2 * 86400000).toISOString(),
    });

    const collectible = body.collectible || createUniversalCollectible({
      name,
      family: body.family || 'other',
      subtype: body.subtype || 'object',
      rarity: body.rarity || 'common',
      seed: drop.id,
    });

    const saved = await upsertDrop({ ...drop, lat: body.lat, lng: body.lng, collectible, claimedCount: 0 });
    return NextResponse.json({ drop: saved, note: 'Drop stored. Claims require /api/drops/claim.' });
  } catch (error) {
    console.error('create drop failed', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Unable to create drop' }, { status: 400 });
  }
}

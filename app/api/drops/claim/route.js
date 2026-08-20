import { NextResponse } from 'next/server';
import { authorizeClaim, seedMemoryDrop } from '../../../../lib/claimAuthority';
import { createDrop } from '../../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../../lib/universalCollectible';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024;
const MAX_DISTANCE_METERS = 1_000_000;

function ensureDemoDrop(dropId) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return;

  const demos = {
    'drop-field-camera-001': {
      name: 'Field Camera Drop', quantity: 25, radiusMeters: 120,
      lat: 40.7648, lng: -73.9808,
      collectible: { name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001' },
    },
    'drop-survey-robot-001': {
      name: 'Survey Robot Drop', quantity: 10, radiusMeters: 90,
      lat: 40.7359, lng: -73.9911,
      collectible: { name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001' },
    },
    'drop-street-deck-001': {
      name: 'Street Deck Drop', quantity: 40, radiusMeters: 150,
      lat: 33.985, lng: -118.4695,
      collectible: { name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001' },
    },
  };

  const raw = demos[dropId];
  if (!raw) return;

  const drop = createDrop({
    id: dropId,
    name: raw.name,
    status: 'active',
    quantity: raw.quantity,
    radiusMeters: raw.radiusMeters,
    startAt: new Date(Date.now() - 86400000).toISOString(),
    endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  seedMemoryDrop({
    ...drop,
    lat: raw.lat,
    lng: raw.lng,
    collectible: createUniversalCollectible(raw.collectible),
    claimedCount: 0,
    reservedCount: 0,
  });
}

function jsonError(error, status = 400) {
  return NextResponse.json(
    { error, ownershipGranted: false },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return jsonError('Request too large', 413);

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid request body');

    const dropId = typeof body.dropId === 'string' ? body.dropId.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
    const requireInZone = body.requireInZone === true;
    const numericDistance = body.distanceMeters === null || body.distanceMeters === undefined
      ? null
      : Number(body.distanceMeters);

    if (!dropId) return jsonError('dropId is required');
    if (dropId.length > 128) return jsonError('Invalid dropId');
    if (!walletAddress) return jsonError('walletAddress is required');
    if (numericDistance !== null && (!Number.isFinite(numericDistance) || numericDistance < 0 || numericDistance > MAX_DISTANCE_METERS)) {
      return jsonError('Invalid distanceMeters');
    }

    ensureDemoDrop(dropId);

    const result = await authorizeClaim({
      dropId,
      walletAddress,
      distanceMeters: numericDistance,
      requireInZone,
    });

    if (!result.authorized) {
      const status = result.reason === 'already_claimed' ? 409
        : result.reason === 'exhausted' ? 409
        : result.reason === 'not_found' ? 404
        : 403;

      return NextResponse.json(
        {
          ...result,
          error: result.reason === 'already_claimed'
            ? 'This wallet already claimed this drop'
            : result.reason === 'exhausted'
              ? 'This drop is currently exhausted'
              : 'Claim denied',
          ownershipGranted: false,
        },
        { status, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      {
        ...result,
        ownershipGranted: false,
        message: 'Claim authorized. Sign the wallet transaction next. Ownership exists only after chain confirmation.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = error?.code;
    const message = error?.message || 'Claim failed';

    if (code === 'CLAIM_STORAGE_UNAVAILABLE') return jsonError('Claim service is temporarily unavailable', 503);
    if (message === 'Drop not found') return jsonError(message, 404);
    if (message.includes('not currently active') || message.includes('Outside public drop zone')) return jsonError(message, 403);
    if (message.includes('already claimed')) return jsonError(message, 409);

    console.error('[drops/claim] request failed', { code, message });
    return jsonError('Claim request could not be completed', 400);
  }
}

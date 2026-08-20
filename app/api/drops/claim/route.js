import { NextResponse } from 'next/server';
import { authorizeClaim, seedMemoryDrop } from '../../../../lib/claimAuthority';
import { createDrop } from '../../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../../lib/universalCollectible';

/** Ensure known demo drops exist in memory before claim (cold start). */
function ensureDemoDrop(dropId) {
  const demos = {
    'drop-field-camera-001': {
      name: 'Field Camera Drop',
      quantity: 25,
      radiusMeters: 120,
      lat: 40.7648,
      lng: -73.9808,
      collectible: { name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001' },
    },
    'drop-survey-robot-001': {
      name: 'Survey Robot Drop',
      quantity: 10,
      radiusMeters: 90,
      lat: 40.7359,
      lng: -73.9911,
      collectible: { name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001' },
    },
    'drop-street-deck-001': {
      name: 'Street Deck Drop',
      quantity: 40,
      radiusMeters: 150,
      lat: 33.985,
      lng: -118.4695,
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
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const dropId = body.dropId;
    const walletAddress = body.walletAddress;
    const distanceMeters = body.distanceMeters;
    const requireInZone = Boolean(body.requireInZone);

    if (!dropId) return NextResponse.json({ error: 'dropId is required' }, { status: 400 });
    if (!walletAddress) return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });

    ensureDemoDrop(dropId);

    const result = await authorizeClaim({
      dropId,
      walletAddress,
      distanceMeters: Number.isFinite(Number(distanceMeters)) ? Number(distanceMeters) : null,
      requireInZone,
    });

    if (!result.authorized) {
      return NextResponse.json(
        {
          ...result,
          error: result.reason === 'already_claimed' ? 'This wallet already claimed this drop' : 'Claim denied',
        },
        { status: result.reason === 'already_claimed' ? 409 : 403 }
      );
    }

    // Authorized ticket only — UI must not show "You own this" until chain confirms.
    return NextResponse.json({
      ...result,
      ownershipGranted: false,
      message:
        'Server authorized a claim ticket. Sign a wallet transaction next. Ownership is only real after chain confirmation.',
    });
  } catch (error) {
    const message = error?.message || 'Claim failed';
    const status =
      message.includes('not found') ? 404
        : message.includes('not currently active') || message.includes('exhausted') || message.includes('Outside')
          ? 403
          : 400;
    return NextResponse.json({ error: message, ownershipGranted: false }, { status });
  }
}

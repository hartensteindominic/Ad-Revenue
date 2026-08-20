import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { authorizeClaim, seedMemoryDrop } from '../../../../lib/claimAuthority';
import { createDrop } from '../../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../../lib/universalCollectible';
import { buildClaimMetadataUri } from '../../../../lib/claimMint';
import { getClaimVoucherConfig, issueClaimVoucher } from '../../../../lib/claimVoucher';

const MAX_BODY_BYTES = 8 * 1024;
const MAX_DROP_ID_LENGTH = 128;

function ensureDemoDrop(dropId) {
  if (process.env.NODE_ENV === 'production') return;

  const demos = {
    'drop-field-camera-001': { name: 'Field Camera Drop', quantity: 25, radiusMeters: 120, lat: 40.7648, lng: -73.9808, collectible: { name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001' } },
    'drop-survey-robot-001': { name: 'Survey Robot Drop', quantity: 10, radiusMeters: 90, lat: 40.7359, lng: -73.9911, collectible: { name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001' } },
    'drop-street-deck-001': { name: 'Street Deck Drop', quantity: 40, radiusMeters: 150, lat: 33.985, lng: -118.4695, collectible: { name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001' } },
  };
  const raw = demos[dropId];
  if (!raw) return;

  const drop = createDrop({ id: dropId, name: raw.name, status: 'active', quantity: raw.quantity, radiusMeters: raw.radiusMeters, startAt: new Date(Date.now() - 86400000).toISOString(), endAt: new Date(Date.now() + 7 * 86400000).toISOString() });
  seedMemoryDrop({ ...drop, lat: raw.lat, lng: raw.lng, collectible: createUniversalCollectible(raw.collectible), claimedCount: 0 });
}

export async function POST(request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Claim persistence is not configured. Production claims are fail-closed until durable storage is available.', ownershipGranted: false }, { status: 503 });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Claim payload is too large.', ownershipGranted: false }, { status: 413 });

    const body = await request.json();
    const dropId = typeof body.dropId === 'string' ? body.dropId.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
    const distanceMeters = body.distanceMeters;
    const requireInZone = Boolean(body.requireInZone);

    if (!dropId || dropId.length > MAX_DROP_ID_LENGTH) return NextResponse.json({ error: 'A valid dropId is required', ownershipGranted: false }, { status: 400 });
    if (!walletAddress) return NextResponse.json({ error: 'walletAddress is required', ownershipGranted: false }, { status: 400 });

    ensureDemoDrop(dropId);

    const result = await authorizeClaim({
      dropId,
      walletAddress,
      distanceMeters: Number.isFinite(Number(distanceMeters)) ? Number(distanceMeters) : null,
      requireInZone,
    });

    if (!result.authorized) {
      return NextResponse.json(
        { ...result, error: result.reason === 'already_claimed' ? 'This wallet already claimed this drop' : 'Claim denied' },
        { status: result.reason === 'already_claimed' ? 409 : 403 }
      );
    }

    const voucherConfig = getClaimVoucherConfig();
    const claimTicket = result.claimTicket;
    const deadline = result.expiresAt
      ? Math.floor(new Date(result.expiresAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 10 * 60;
    const uri = buildClaimMetadataUri({ collectible: result.collectible, claimTicket, dropId });

    let voucher = null;
    let signature = null;
    let claimMode = 'ticket-only';

    if (voucherConfig.privateKey && voucherConfig.contract && voucherConfig.royaltyReceiver) {
      const issued = await issueClaimVoucher({
        recipient: walletAddress,
        dropId,
        claimTicket,
        uri,
        royaltyBps: 500,
        deadline,
        nonce: BigInt(`0x${randomBytes(16).toString('hex')}`),
      });
      voucher = issued.voucher;
      signature = issued.signature;
      claimMode = 'signed-voucher';
    }

    return NextResponse.json(
      {
        ...result,
        claimMode,
        claimVoucher: voucher,
        claimSignature: signature,
        metadataUri: uri,
        ownershipGranted: false,
        message:
          claimMode === 'signed-voucher'
            ? 'Claim reserved and cryptographically authorized. Redeem the signed voucher on-chain; ownership is granted only after the transaction confirms.'
            : 'Claim reserved. Configure the claim signer and NFT contract to enable cryptographically bound on-chain redemption.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error?.message || 'Claim failed';
    const status = message.includes('not found') ? 404
      : message.includes('not currently active') || message.includes('exhausted') || message.includes('Outside') ? 403
        : message.includes('valid wallet') ? 400
          : 400;
    return NextResponse.json({ error: message, ownershipGranted: false }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { authorizeClaim, seedMemoryDrop } from '../../../../lib/claimAuthority';
import { createDrop } from '../../../../lib/dropEngine';
import { createUniversalCollectible } from '../../../../lib/universalCollectible';
import { buildClaimMetadataUri } from '../../../../lib/claimMint';
import { getClaimVoucherConfig, issueClaimVoucher, validateClaimVoucherConfig } from '../../../../lib/claimVoucher';

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

async function buildVoucher({ result, dropId, walletAddress }) {
  const config = getClaimVoucherConfig();
  const hasSignerConfig = Boolean(config.privateKey && config.contract && config.royaltyReceiver && result.claimTicket);

  if (!hasSignerConfig) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Claim signing is not configured. Production claims are fail-closed until the NFT contract, signer and royalty receiver are configured.');
    }
    return { claimMode: 'ticket-only', claimVoucher: null, claimSignature: null, metadataUri: null };
  }

  const deadline = result.expiresAt
    ? Math.floor(new Date(result.expiresAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 10 * 60;
  const uri = buildClaimMetadataUri({ collectible: result.collectible, claimTicket: result.claimTicket, dropId });
  const issued = await issueClaimVoucher({
    recipient: walletAddress,
    dropId,
    claimTicket: result.claimTicket,
    uri,
    royaltyBps: 500,
    deadline,
    nonce: BigInt(`0x${randomBytes(16).toString('hex')}`),
  });

  return { claimMode: 'signed-voucher', claimVoucher: issued.voucher, claimSignature: issued.signature, metadataUri: uri };
}

export async function POST(request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Claim persistence is not configured. Production claims are fail-closed until durable storage is available.', ownershipGranted: false }, { status: 503 });
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        validateClaimVoucherConfig();
      } catch (configError) {
        return NextResponse.json({ error: configError.message, ownershipGranted: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Claim payload is too large.', ownershipGranted: false }, { status: 413 });

    const body = await request.json();
    const dropId = typeof body.dropId === 'string' ? body.dropId.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
    const distanceMeters = body.distanceMeters;
    const requireInZone = Boolean(body.requireInZone);

    if (!dropId || dropId.length > MAX_DROP_ID_LENGTH) return NextResponse.json({ error: 'A valid dropId is required', ownershipGranted: false }, { status: 400 });
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return NextResponse.json({ error: 'A valid walletAddress is required', ownershipGranted: false }, { status: 400 });

    ensureDemoDrop(dropId);

    const result = await authorizeClaim({
      dropId,
      walletAddress,
      distanceMeters: Number.isFinite(Number(distanceMeters)) ? Number(distanceMeters) : null,
      requireInZone,
    });

    if (!result.authorized) {
      if (result.reason === 'already_claimed' && result.claimTicket) {
        const voucher = await buildVoucher({ result, dropId, walletAddress });
        return NextResponse.json(
          {
            ...result,
            ...voucher,
            ownershipGranted: false,
            error: 'This wallet already has a claim reservation for this drop',
            message: voucher.claimMode === 'signed-voucher'
              ? 'Your existing claim reservation was found. You can safely retry the on-chain redemption; the contract prevents ticket replay.'
              : 'Your existing claim reservation was found. Configure the claim signer to enable on-chain voucher redemption.',
          },
          { status: 409, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      return NextResponse.json({ ...result, error: 'Claim denied', ownershipGranted: false }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    const voucher = await buildVoucher({ result, dropId, walletAddress });

    return NextResponse.json(
      {
        ...result,
        ...voucher,
        ownershipGranted: false,
        message:
          voucher.claimMode === 'signed-voucher'
            ? 'Claim reserved and cryptographically authorized. Redeem the signed voucher on-chain; ownership is granted only after the transaction confirms.'
            : 'Claim reserved. Configure the claim signer and NFT contract to enable cryptographically bound on-chain redemption.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error?.message || 'Claim failed';
    const status = message.includes('not found') ? 404
      : message.includes('not currently active') || message.includes('exhausted') || message.includes('Outside') ? 403
        : message.includes('signing is not configured') || message.includes('Claim signer') || message.includes('NFT contract') ? 503
          : 400;
    return NextResponse.json({ error: message, ownershipGranted: false }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

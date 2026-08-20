import { NextResponse } from 'next/server';
import { createTradeOffer, canAcceptTrade, transitionTrade, isTradeExpired } from '../../../lib/tradingEngine';
import { saveTradeOffer, getTradeOffer } from '../../../lib/claimAuthority';
import { verifyMarketplaceSettlement } from '../../../lib/transactionVerification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;
const DEAD_RECIPIENT = '0x000000000000000000000000000000000000dEaD';

function configuredChainId() {
  const raw = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '0xaa36a7';
  const value = String(raw).toLowerCase();
  const parsed = value.startsWith('0x') ? Number.parseInt(value, 16) : Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 11155111;
}

function configuredSettlementContract() {
  return process.env.VOXEL_SETTLEMENT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_VOXEL_MARKET_ADDRESS || '';
}

function looksLikeWallet(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function noStore(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    if (!id || id.length > 128) return noStore({ error: 'Valid id is required' }, 400);

    const offer = await getTradeOffer(id);
    if (!offer) return noStore({ error: 'Offer not found' }, 404);
    return noStore({
      offer,
      expired: isTradeExpired(offer),
      note: 'Application state remains untrusted until server-verified semantic chain settlement is validated.',
    });
  } catch (error) {
    console.error('[trades] GET failed', error);
    return noStore({ error: 'Unable to load offer' }, 500);
  }
}

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return noStore({ error: 'Request too large', ownershipChanged: false }, 413);

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return noStore({ error: 'Invalid request body' }, 400);
    const action = typeof body.action === 'string' ? body.action : 'create';

    if (action === 'create') {
      if (!looksLikeWallet(body.offerer)) return noStore({ error: 'A valid offerer wallet address is required' }, 400);
      if (body.recipient && !looksLikeWallet(body.recipient)) return noStore({ error: 'Invalid recipient wallet address' }, 400);
      if (!Array.isArray(body.offered) || body.offered.length > 50) return noStore({ error: 'Invalid offered items' }, 400);
      if (!Array.isArray(body.requested) || body.requested.length > 50) return noStore({ error: 'Invalid requested items' }, 400);

      const offer = createTradeOffer({
        offerer: body.offerer,
        recipient: body.recipient || DEAD_RECIPIENT,
        offered: body.offered,
        requested: body.requested,
        expiresAt: body.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      // Never let the caller choose an existing offer ID and overwrite another offer.
      offer.id = `trade-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 12)}`;
      const saved = await saveTradeOffer(offer);
      return noStore({ offer: saved, ownershipChanged: false });
    }

    if (action === 'accept') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!id || id.length > 128) return noStore({ error: 'Valid offer id is required' }, 400);
      const existing = await getTradeOffer(id);
      if (!existing) return noStore({ error: 'Offer not found' }, 404);

      const wallet = String(body.walletAddress || '').trim().toLowerCase();
      if (!looksLikeWallet(wallet)) return noStore({ error: 'A valid walletAddress is required' }, 400);
      const working = { ...existing, recipient: existing.recipient === DEAD_RECIPIENT.toLowerCase() ? wallet : existing.recipient };
      if (!canAcceptTrade(working, wallet)) {
        return noStore({ error: 'This wallet cannot accept this offer (wrong recipient or expired)', ownershipChanged: false }, 403);
      }

      const accepted = transitionTrade(working, 'accepted');
      const submitted = transitionTrade(accepted, 'submitted');
      const saved = await saveTradeOffer(submitted);
      return noStore({ offer: saved, ownershipChanged: false, nextStep: 'wallet_signatures_and_chain_settlement', message: 'Offer accepted. Ownership changes only after semantic settlement verification.' });
    }

    if (action === 'confirm') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!id || id.length > 128) return noStore({ error: 'Valid offer id is required' }, 400);
      const existing = await getTradeOffer(id);
      if (!existing) return noStore({ error: 'Offer not found' }, 404);
      if (existing.state !== 'submitted') return noStore({ error: 'Only submitted offers can be confirmed' }, 400);

      const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : '';
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return noStore({ error: 'Valid txHash is required', ownershipChanged: false }, 400);

      const settlementContract = configuredSettlementContract();
      if (!looksLikeWallet(settlementContract)) return noStore({ error: 'Settlement contract is not configured', ownershipChanged: false, chainConfirmed: false }, 503);

      const verification = await verifyMarketplaceSettlement(txHash, {
        expectedChainId: configuredChainId(),
        expectedTo: settlementContract,
        buyer: existing.recipient,
        seller: existing.offerer,
      });

      if (!verification.confirmed || !verification.semanticSettlementVerified) {
        return noStore({
          error: `Semantic settlement not confirmed: ${verification.reason || 'settlement_event_not_found'}`,
          ownershipChanged: false,
          chainConfirmed: Boolean(verification.confirmed),
          semanticSettlementVerified: false,
          verification,
        }, 409);
      }

      const confirmed = transitionTrade(existing, 'confirmed');
      confirmed.txHash = verification.transactionHash;
      confirmed.confirmedAt = new Date().toISOString();
      confirmed.chainId = verification.chainId;
      confirmed.blockNumber = verification.blockNumber;
      confirmed.settlementContract = verification.to;
      confirmed.semanticSettlementVerified = true;
      confirmed.settlementEvent = verification.settlementEvent;
      confirmed.tokenId = verification.tokenId;
      const saved = await saveTradeOffer(confirmed);

      return noStore({
        offer: saved,
        ownershipChanged: true,
        chainConfirmed: true,
        semanticSettlementVerified: true,
        txHash: verification.transactionHash,
        verification,
        message: 'Marketplace settlement was verified on-chain and matched the expected participants.',
      });
    }

    return noStore({ error: 'Unknown action', ownershipChanged: false }, 400);
  } catch (error) {
    console.error('[trades] action failed', error);
    return noStore({ error: 'Trade action could not be completed', ownershipChanged: false }, 400);
  }
}

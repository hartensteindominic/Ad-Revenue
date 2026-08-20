import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createTradeOffer, canAcceptTrade, transitionTrade, isTradeExpired } from '../../../lib/tradingEngine';
import { saveTradeOffer, getTradeOffer } from '../../../lib/claimAuthority';
import { verifyMarketplaceSettlement } from '../../../lib/transactionVerification';

const PLACEHOLDER_RECIPIENT = '0x000000000000000000000000000000000000dead';
let supabase = null;

function configuredChainId() {
  const raw = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '0xaa36a7';
  const value = String(raw).toLowerCase();
  return value.startsWith('0x') ? Number.parseInt(value, 16) : Number.parseInt(value, 10);
}

function configuredSettlementContract() {
  return process.env.VOXEL_SETTLEMENT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_VOXEL_MARKET_ADDRESS || '';
}

function looksLikeWallet(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabase) supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return supabase;
}

async function confirmSettlementAtomically({ tradeId, verification }) {
  const db = getSupabase();
  if (!db) throw new Error('Durable trade storage is not configured');
  const { data, error } = await db.rpc('confirm_voxel_trade_settlement', {
    p_trade_id: tradeId,
    p_tx_hash: verification.transactionHash,
    p_confirmed_at: new Date().toISOString(),
    p_chain_id: verification.chainId,
    p_block_number: verification.blockNumber,
    p_settlement_contract: verification.to,
    p_settlement_event: verification.settlementEvent,
    p_token_id: verification.tokenId == null ? null : String(verification.tokenId),
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const offer = await getTradeOffer(id);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ offer, expired: isTradeExpired(offer), note: 'Application state remains untrusted until a server-verified semantic chain settlement is validated.' });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to load offer' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Trade persistence is not configured. Production trade actions are fail-closed until Supabase service-role storage is available.', ownershipChanged: false }, { status: 503 });
    }

    const body = await request.json();
    const action = body.action || 'create';

    if (action === 'create') {
      if (!looksLikeWallet(body.offerer)) return NextResponse.json({ error: 'A valid offerer wallet address is required' }, { status: 400 });
      if (body.recipient && !looksLikeWallet(body.recipient)) return NextResponse.json({ error: 'Invalid recipient wallet address' }, { status: 400 });
      const offer = createTradeOffer({
        offerer: body.offerer,
        recipient: body.recipient || PLACEHOLDER_RECIPIENT,
        offered: body.offered || [],
        requested: body.requested || [],
        expiresAt: body.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      offer.id = body.id || `trade-${Date.now().toString(36)}`;
      const saved = await saveTradeOffer(offer);
      return NextResponse.json({ offer: saved, ownershipChanged: false });
    }

    if (action === 'accept') {
      const existing = await getTradeOffer(body.id);
      if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      const wallet = String(body.walletAddress || '').trim().toLowerCase();
      if (!looksLikeWallet(wallet)) return NextResponse.json({ error: 'A valid walletAddress is required' }, { status: 400 });
      const working = { ...existing, recipient: existing.recipient === PLACEHOLDER_RECIPIENT ? wallet : existing.recipient };
      if (!canAcceptTrade(working, wallet)) return NextResponse.json({ error: 'This wallet cannot accept this offer (wrong recipient or expired)', ownershipChanged: false }, { status: 403 });
      const accepted = transitionTrade(working, 'accepted');
      const submitted = transitionTrade(accepted, 'submitted');
      const saved = await saveTradeOffer(submitted);
      return NextResponse.json({ offer: saved, ownershipChanged: false, nextStep: 'wallet_signatures_and_chain_settlement', message: 'Offer accepted. Ownership changes only after semantic settlement verification.' });
    }

    if (action === 'confirm') {
      const existing = await getTradeOffer(body.id);
      if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      if (existing.state !== 'submitted' && existing.state !== 'confirmed') return NextResponse.json({ error: 'Only submitted offers can be confirmed', ownershipChanged: false }, { status: 400 });
      if (!body.txHash) return NextResponse.json({ error: 'txHash is required to confirm', ownershipChanged: false }, { status: 400 });

      const settlementContract = configuredSettlementContract();
      if (!settlementContract) return NextResponse.json({ error: 'Settlement contract is not configured', ownershipChanged: false, chainConfirmed: false }, { status: 503 });

      const verification = await verifyMarketplaceSettlement(body.txHash, {
        expectedChainId: configuredChainId(),
        expectedTo: settlementContract,
        buyer: existing.recipient,
        seller: existing.offerer,
        tokenId: body.tokenId ?? existing.tokenId ?? null,
      });

      if (!verification.confirmed || !verification.semanticSettlementVerified) {
        return NextResponse.json({
          error: `Semantic settlement not confirmed: ${verification.reason || 'settlement_event_not_found'}`,
          ownershipChanged: false,
          chainConfirmed: Boolean(verification.confirmed),
          semanticSettlementVerified: false,
          verification,
        }, { status: 409 });
      }

      if (existing.state === 'confirmed' && existing.txHash === verification.transactionHash) {
        return NextResponse.json({ offer: existing, ownershipChanged: true, chainConfirmed: true, semanticSettlementVerified: true, txHash: verification.transactionHash, verification, message: 'Settlement was already confirmed.' });
      }

      const row = await confirmSettlementAtomically({ tradeId: existing.id, verification });
      const saved = row ? await getTradeOffer(existing.id) : existing;
      return NextResponse.json({
        offer: saved,
        ownershipChanged: true,
        chainConfirmed: true,
        semanticSettlementVerified: true,
        txHash: verification.transactionHash,
        verification,
        message: 'Marketplace settlement was verified on-chain and committed atomically.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Trade action failed', ownershipChanged: false }, { status: 400 });
  }
}

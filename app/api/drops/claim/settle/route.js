import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyClaimSettlement } from '../../../../../lib/transactionVerification';

let supabase = null;

function configuredChainId() {
  const raw = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '0xaa36a7';
  const value = String(raw).toLowerCase();
  return value.startsWith('0x') ? Number.parseInt(value, 16) : Number.parseInt(value, 10);
}

function configuredNftContract() {
  return process.env.VOXEL_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';
}

function looksLikeWallet(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabase) {
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

export async function POST(request) {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Claim settlement storage is not configured. Production ownership remains fail-closed.',
        ownershipGranted: false,
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }

    const body = await request.json();
    const dropId = typeof body.dropId === 'string' ? body.dropId.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
    const claimTicket = typeof body.claimTicket === 'string' ? body.claimTicket.trim() : '';
    const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : '';
    const tokenId = body.tokenId == null ? null : String(body.tokenId).trim();

    if (!dropId || dropId.length > 128) return NextResponse.json({ error: 'A valid dropId is required', ownershipGranted: false }, { status: 400 });
    if (!looksLikeWallet(walletAddress)) return NextResponse.json({ error: 'A valid walletAddress is required', ownershipGranted: false }, { status: 400 });
    if (!claimTicket || claimTicket.length > 256) return NextResponse.json({ error: 'A valid claimTicket is required', ownershipGranted: false }, { status: 400 });
    if (!txHash) return NextResponse.json({ error: 'txHash is required', ownershipGranted: false }, { status: 400 });

    const nftContract = configuredNftContract();
    if (!nftContract) {
      return NextResponse.json({ error: 'NFT settlement contract is not configured', ownershipGranted: false }, { status: 503 });
    }

    const verification = await verifyClaimSettlement(txHash, {
      expectedChainId: configuredChainId(),
      expectedTo: nftContract,
      walletAddress,
      claimTicket,
      tokenId,
    });

    if (!verification.confirmed || !verification.claimSettlementVerified) {
      return NextResponse.json({
        error: `Claim settlement not confirmed: ${verification.reason || 'claim_mint_event_not_found'}`,
        ownershipGranted: false,
        chainConfirmed: Boolean(verification.confirmed),
        claimSettlementVerified: false,
        verification,
      }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json({
        error: 'Durable claim storage is required before ownership can be marked confirmed.',
        ownershipGranted: false,
        chainConfirmed: true,
        claimSettlementVerified: true,
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }

    const { data, error } = await db.rpc('confirm_voxel_drop_claim', {
      p_drop_id: dropId,
      p_wallet_address: walletAddress.toLowerCase(),
      p_claim_ticket: claimTicket,
      p_tx_hash: verification.transactionHash,
      p_confirmed_at: new Date().toISOString(),
      p_chain_id: verification.chainId,
      p_block_number: verification.blockNumber,
      p_settlement_contract: verification.to,
      p_settlement_event: verification.settlementEvent,
      p_token_id: verification.tokenId,
    });

    if (error) throw new Error(error.message);

    const claim = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      claim,
      ownershipGranted: true,
      chainConfirmed: true,
      claimSettlementVerified: true,
      txHash: verification.transactionHash,
      tokenId: verification.tokenId,
      message: 'NFT mint was verified on-chain and the claim reservation was committed atomically.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({
      error: error?.message || 'Claim settlement failed',
      ownershipGranted: false,
    }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}

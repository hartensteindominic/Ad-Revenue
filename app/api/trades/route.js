import { NextResponse } from 'next/server';
import { createTradeOffer, canAcceptTrade, transitionTrade, isTradeExpired } from '../../../lib/tradingEngine';
import { saveTradeOffer, getTradeOffer } from '../../../lib/claimAuthority';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const offer = await getTradeOffer(id);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({
      offer,
      expired: isTradeExpired(offer),
      note: 'Application state only until a chain transaction confirms settlement.',
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to load offer' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'create';

    if (action === 'create') {
      const offer = createTradeOffer({
        offerer: body.offerer,
        recipient: body.recipient || '0x000000000000000000000000000000000000dEaD',
        offered: body.offered || [],
        requested: body.requested || [],
        expiresAt: body.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      offer.id = body.id || `trade-${Date.now().toString(36)}`;
      const saved = await saveTradeOffer(offer);
      return NextResponse.json({
        offer: saved,
        ownershipChanged: false,
        message: 'Trade offer stored. Recipient must accept; both wallets must sign before ownership changes.',
      });
    }

    if (action === 'accept') {
      const existing = await getTradeOffer(body.id);
      if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

      const wallet = String(body.walletAddress || '').trim().toLowerCase();
      if (!wallet) return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });

      // Open QR handoff: placeholder recipient becomes the accepting wallet.
      const working = {
        ...existing,
        recipient:
          existing.recipient === '0x000000000000000000000000000000000000dead'
            ? wallet
            : existing.recipient,
      };

      if (!canAcceptTrade(working, wallet)) {
        return NextResponse.json(
          { error: 'This wallet cannot accept this offer (wrong recipient or expired)', ownershipChanged: false },
          { status: 403 }
        );
      }

      const accepted = transitionTrade(working, 'accepted');
      const submitted = transitionTrade(accepted, 'submitted');
      const saved = await saveTradeOffer(submitted);

      return NextResponse.json({
        offer: saved,
        ownershipChanged: false,
        nextStep: 'wallet_signatures_and_chain_settlement',
        message:
          'Offer accepted and marked submitted in application state. Ownership changes only after on-chain confirmation.',
      });
    }

    if (action === 'confirm') {
      // Demo helper: marks confirmed only when explicitly requested.
      // Real production should set confirmed from a transaction receipt webhook/indexer.
      const existing = await getTradeOffer(body.id);
      if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      if (existing.state !== 'submitted') {
        return NextResponse.json({ error: 'Only submitted offers can be confirmed' }, { status: 400 });
      }
      if (!body.txHash) {
        return NextResponse.json(
          {
            error: 'txHash is required to confirm. Do not confirm without a chain transaction.',
            ownershipChanged: false,
          },
          { status: 400 }
        );
      }
      const confirmed = transitionTrade(existing, 'confirmed');
      confirmed.txHash = body.txHash;
      const saved = await saveTradeOffer(confirmed);
      return NextResponse.json({
        offer: saved,
        ownershipChanged: true,
        txHash: body.txHash,
        message: 'Marked confirmed with provided txHash. Verify the hash on a block explorer.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Trade action failed' }, { status: 400 });
  }
}

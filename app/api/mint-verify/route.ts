import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { getCatalogItem } from '../../../lib/catalog';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const wallet = url.searchParams.get('wallet')?.toLowerCase();
    if (!sessionId || !wallet) return NextResponse.json({ error: 'session_id and wallet are required' }, { status: 400 });
    if (!/^0x[a-f0-9]{40}$/.test(wallet)) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataWallet = session.metadata?.wallet?.toLowerCase();
    const mintMode = session.metadata?.mint_mode;
    const catalogId = Number(session.metadata?.catalog_id);
    if (!['usd', 'physical_nft'].includes(String(mintMode)) || metadataWallet !== wallet || session.payment_status !== 'paid') {
      return NextResponse.json({ paid: false }, { status: 402 });
    }
    if (!Number.isInteger(catalogId) || catalogId < 1) return NextResponse.json({ error: 'Invalid mint object' }, { status: 400 });

    const item = getCatalogItem(catalogId - 1);
    if (!item) return NextResponse.json({ error: 'Catalog object unavailable' }, { status: 404 });
    return NextResponse.json({
      paid: true,
      fulfillmentIncluded: mintMode === 'physical_nft',
      fulfillmentStatus: mintMode === 'physical_nft' ? 'awaiting_fulfillment' : null,
      catalogId,
      wallet,
      item: { id: item.id, name: item.name, creator: item.creator, rarity: item.rarity, realityBasis: item.realityBasis, priceUsd: item.priceUsd, sourceUrl: item.sourceUrl, sourceName: item.sourceName },
      sessionId,
    });
  } catch (error) {
    console.error('USD mint verification failed', error);
    return NextResponse.json({ error: 'Unable to verify payment' }, { status: 500 });
  }
}

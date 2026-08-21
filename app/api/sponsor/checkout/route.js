import Stripe from 'stripe';
import { getNFTById } from '../../../../lib/world/nftWorldCatalog.js';
import { buildCampaign } from '../../../../lib/sponsor/campaignLedger.js';

export const runtime = 'nodejs';

function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secret, { apiVersion: '2025-07-30.basil' });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const amountCents = Number(body?.amountCents);
    const campaignId = String(body?.campaignId || '').trim();
    const campaignName = String(body?.campaignName || 'Voxel Vault Discovery Campaign').trim().slice(0, 120);
    const featuredNFTId = body?.featuredNFTId == null ? null : Number(body.featuredNFTId);
    if (!campaignId || !/^[-_a-zA-Z0-9]{3,64}$/.test(campaignId)) return Response.json({ error: 'Invalid campaignId' }, { status: 400 });
    if (!Number.isSafeInteger(amountCents) || amountCents < 100) return Response.json({ error: 'Campaign budget must be at least $1.00' }, { status: 400 });
    if (featuredNFTId !== null && !getNFTById(featuredNFTId)) return Response.json({ error: 'Unknown featured NFT' }, { status: 400 });

    const campaign = buildCampaign({ id: campaignId, name: campaignName, budgetCents: amountCents, maxClaims: 0 });
    const origin = (process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://voxel-vault.vercel.app').replace(/\/$/, '');
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: campaign.name, description: 'Sponsored Voxel Vault Discovery Campaign. Funds collectible rewards and spatial experiences.' }, unit_amount: campaign.budgetCents }, quantity: 1 }],
      success_url: `${origin}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sponsor`,
      metadata: { campaignId: campaign.id, campaignName: campaign.name, featuredNFTId: featuredNFTId == null ? '' : String(featuredNFTId), sponsoredDisclosure: 'true' },
    }, { idempotencyKey: `vv-sponsor-${campaign.id}-${campaign.budgetCents}` });
    return Response.json({ url: session.url, sessionId: session.id, campaign: { id: campaign.id, budgetCents: campaign.budgetCents, disclosed: true } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unable to create sponsored campaign checkout' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

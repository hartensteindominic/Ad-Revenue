import { getSupabaseAdmin } from '../supabase-admin';

export async function recordStripeEvent(event) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('stripe_events').upsert(
    { id: event.id, type: event.type, livemode: Boolean(event.livemode) },
    { onConflict: 'id', ignoreDuplicates: true },
  ).select('id').maybeSingle();
  if (error) throw error;
  return { duplicate: !data, id: event.id };
}

export async function persistRewardEvent(reward) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('reward_events').upsert({
    id: reward.id,
    payment_event_id: reward.paymentId,
    campaign_id: reward.campaignId,
    collector_wallet: reward.collector,
    amount_cents: reward.amountCents,
    currency: String(reward.currency || 'usd').toLowerCase(),
    status: 'pending',
  }, { onConflict: 'id', ignoreDuplicates: true }).select('id,status').maybeSingle();
  if (error) throw error;
  return data;
}

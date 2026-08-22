-- Physical product + NFT order ledger.
-- Stripe captures the buyer's shipping address. An order is only marked shipped
-- after a configured fulfillment adapter confirms submission/tracking.
create table if not exists public.physical_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  catalog_id integer not null,
  catalog_key text not null,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text unique,
  shipping_name text not null,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_country text not null,
  currency text not null default 'usd',
  physical_amount_cents integer not null check (physical_amount_cents >= 0),
  nft_amount_cents integer not null check (nft_amount_cents >= 0),
  fulfillment_status text not null default 'awaiting_fulfillment' check (fulfillment_status in ('awaiting_fulfillment','submitted','shipped','delivered','cancelled','failed')),
  fulfillment_order_id text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.physical_orders enable row level security;
create policy "buyers view own physical orders" on public.physical_orders for select using (buyer_id = auth.uid());
create index if not exists physical_orders_buyer_id_idx on public.physical_orders(buyer_id);
create index if not exists physical_orders_fulfillment_status_idx on public.physical_orders(fulfillment_status);

-- Optional automated fulfillment adapter. Configure server-side only:
-- FULFILLMENT_API_URL, FULFILLMENT_API_KEY. Without these, orders remain awaiting_fulfillment.

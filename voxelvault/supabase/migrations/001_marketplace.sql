create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  storage_path text not null,
  preview_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  currency text not null default 'usd',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  unit_amount_cents integer not null check (unit_amount_cents >= 0),
  created_at timestamptz not null default now(),
  unique(order_id, asset_id)
);

create table if not exists public.seller_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.download_entitlements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(buyer_id, asset_id)
);

alter table public.assets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seller_accounts enable row level security;
alter table public.download_entitlements enable row level security;

create policy "published assets are public" on public.assets for select using (status = 'published' or seller_id = auth.uid());
create policy "sellers manage own assets" on public.assets for insert with check (seller_id = auth.uid());
create policy "sellers update own assets" on public.assets for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "buyers view own orders" on public.orders for select using (buyer_id = auth.uid());
create policy "buyers view own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "seller sees own order items" on public.order_items for select using (seller_id = auth.uid());
create policy "seller sees own account" on public.seller_accounts for select using (user_id = auth.uid());
create policy "user manages own seller account" on public.seller_accounts for insert with check (user_id = auth.uid());
create policy "user updates own seller account" on public.seller_accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "buyers view own entitlements" on public.download_entitlements for select using (buyer_id = auth.uid());

create index if not exists assets_seller_id_idx on public.assets(seller_id);
create index if not exists assets_status_idx on public.assets(status);
create index if not exists order_items_seller_id_idx on public.order_items(seller_id);
create index if not exists entitlements_buyer_id_idx on public.download_entitlements(buyer_id);

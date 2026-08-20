-- Voxel Vault discovery + claim + trade persistence
-- Run in Supabase SQL editor when SUPABASE_* env vars are configured.

create table if not exists public.voxel_drops (
  id text primary key,
  name text not null,
  status text not null default 'draft',
  quantity integer not null check (quantity >= 1 and quantity <= 10000),
  claimed_count integer not null default 0 check (claimed_count >= 0),
  public_zone_id text,
  radius_meters integer not null default 50,
  lat double precision,
  lng double precision,
  start_at timestamptz,
  end_at timestamptz,
  max_claims_per_wallet integer not null default 1,
  collectible jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.voxel_claims (
  id uuid primary key default gen_random_uuid(),
  drop_id text not null references public.voxel_drops(id) on delete cascade,
  wallet_address text not null,
  status text not null default 'authorized'
    check (status in ('authorized', 'submitted', 'confirmed', 'rejected', 'expired')),
  claim_ticket text not null unique,
  client_distance_meters double precision,
  created_at timestamptz not null default now(),
  unique (drop_id, wallet_address)
);

create table if not exists public.voxel_trade_offers (
  id text primary key,
  state text not null default 'pending',
  offerer text not null,
  recipient text not null,
  offered jsonb not null default '[]'::jsonb,
  requested jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voxel_drops_status_idx on public.voxel_drops(status);
create index if not exists voxel_claims_wallet_idx on public.voxel_claims(wallet_address);
create index if not exists voxel_trade_offers_recipient_idx on public.voxel_trade_offers(recipient);

-- Service role bypasses RLS; enable RLS so anon keys cannot write claims.
alter table public.voxel_drops enable row level security;
alter table public.voxel_claims enable row level security;
alter table public.voxel_trade_offers enable row level security;

create policy "public can read active drops" on public.voxel_drops
  for select using (status in ('active', 'scheduled'));

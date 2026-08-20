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

-- Atomic claim reservation. The row lock prevents concurrent claims from
-- exceeding the finite drop quantity across multiple server instances.
create or replace function public.reserve_voxel_drop_claim(
  p_drop_id text,
  p_wallet_address text,
  p_claim_ticket text,
  p_client_distance_meters double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.voxel_drops%rowtype;
  inserted_claim public.voxel_claims%rowtype;
begin
  select * into d
  from public.voxel_drops
  where id = p_drop_id
  for update;

  if not found then
    raise exception 'Drop not found' using errcode = 'P0002';
  end if;

  if d.status not in ('active', 'scheduled') then
    raise exception 'Drop is not currently active' using errcode = 'P0003';
  end if;

  if d.start_at is not null and now() < d.start_at then
    raise exception 'Drop has not started' using errcode = 'P0003';
  end if;

  if d.end_at is not null and now() > d.end_at then
    raise exception 'Drop has ended' using errcode = 'P0003';
  end if;

  if d.claimed_count >= d.quantity then
    raise exception 'Drop is exhausted' using errcode = 'P0004';
  end if;

  if exists (
    select 1 from public.voxel_claims
    where drop_id = p_drop_id and wallet_address = lower(trim(p_wallet_address))
  ) then
    raise exception 'Wallet already claimed this drop' using errcode = '23505';
  end if;

  insert into public.voxel_claims (
    drop_id, wallet_address, status, claim_ticket, client_distance_meters
  ) values (
    p_drop_id, lower(trim(p_wallet_address)), 'authorized', p_claim_ticket, p_client_distance_meters
  ) returning * into inserted_claim;

  update public.voxel_drops
  set claimed_count = claimed_count + 1
  where id = p_drop_id;

  return jsonb_build_object(
    'claim_id', inserted_claim.id,
    'claim_ticket', inserted_claim.claim_ticket,
    'claimed_count', d.claimed_count + 1,
    'quantity', d.quantity
  );
end;
$$;

revoke all on function public.reserve_voxel_drop_claim(text, text, text, double precision) from public;
grant execute on function public.reserve_voxel_drop_claim(text, text, text, double precision) to service_role;

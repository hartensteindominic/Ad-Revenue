-- Production hardening for finite drops and durable trade settlement metadata.
-- Apply after 002_drops_claims_trades.sql.

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

  if d.status <> 'active' then
    raise exception 'Drop is not currently active' using errcode = 'P0003';
  end if;

  if d.start_at is not null and now() < d.start_at then
    raise exception 'Drop has not started' using errcode = 'P0003';
  end if;

  if d.end_at is not null and now() >= d.end_at then
    raise exception 'Drop has ended' using errcode = 'P0003';
  end if;

  if d.claimed_count >= d.quantity then
    raise exception 'Drop is exhausted' using errcode = 'P0004';
  end if;

  if d.max_claims_per_wallet < 1 then
    raise exception 'Drop claim limit is invalid' using errcode = 'P0005';
  end if;

  if exists (
    select 1
    from public.voxel_claims
    where drop_id = p_drop_id
      and wallet_address = lower(trim(p_wallet_address))
      and status in ('authorized', 'submitted', 'confirmed')
  ) then
    raise exception 'Wallet already claimed this drop' using errcode = '23505';
  end if;

  insert into public.voxel_claims (
    drop_id,
    wallet_address,
    status,
    claim_ticket,
    client_distance_meters
  ) values (
    p_drop_id,
    lower(trim(p_wallet_address)),
    'authorized',
    p_claim_ticket,
    p_client_distance_meters
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

alter table public.voxel_trade_offers
  add column if not exists tx_hash text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists chain_id bigint,
  add column if not exists block_number bigint,
  add column if not exists settlement_contract text,
  add column if not exists semantic_settlement_verified boolean not null default false,
  add column if not exists settlement_event text,
  add column if not exists token_id text;

create index if not exists voxel_trade_offers_state_idx
  on public.voxel_trade_offers(state);

create index if not exists voxel_trade_offers_tx_hash_idx
  on public.voxel_trade_offers(tx_hash)
  where tx_hash is not null;

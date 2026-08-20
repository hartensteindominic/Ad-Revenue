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
  select * into d from public.voxel_drops where id = p_drop_id for update;
  if not found then raise exception 'Drop not found' using errcode = 'P0002'; end if;
  if d.status <> 'active' then raise exception 'Drop is not currently active' using errcode = 'P0003'; end if;
  if d.start_at is not null and now() < d.start_at then raise exception 'Drop has not started' using errcode = 'P0003'; end if;
  if d.end_at is not null and now() >= d.end_at then raise exception 'Drop has ended' using errcode = 'P0003'; end if;
  if d.claimed_count >= d.quantity then raise exception 'Drop is exhausted' using errcode = 'P0004'; end if;
  if d.max_claims_per_wallet < 1 then raise exception 'Drop claim limit is invalid' using errcode = 'P0005'; end if;

  if exists (
    select 1 from public.voxel_claims
    where drop_id = p_drop_id
      and wallet_address = lower(trim(p_wallet_address))
      and status in ('authorized', 'submitted', 'confirmed')
  ) then
    raise exception 'Wallet already claimed this drop' using errcode = '23505';
  end if;

  insert into public.voxel_claims (drop_id, wallet_address, status, claim_ticket, client_distance_meters)
  values (p_drop_id, lower(trim(p_wallet_address)), 'authorized', p_claim_ticket, p_client_distance_meters)
  returning * into inserted_claim;

  update public.voxel_drops set claimed_count = claimed_count + 1 where id = p_drop_id;

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

create or replace function public.confirm_voxel_trade_settlement(
  p_trade_id text,
  p_tx_hash text,
  p_confirmed_at timestamptz,
  p_chain_id bigint,
  p_block_number bigint,
  p_settlement_contract text,
  p_settlement_event text,
  p_token_id text
)
returns public.voxel_trade_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.voxel_trade_offers%rowtype;
  updated public.voxel_trade_offers%rowtype;
begin
  select * into t from public.voxel_trade_offers where id = p_trade_id for update;
  if not found then raise exception 'Trade offer not found' using errcode = 'P0002'; end if;

  if t.state = 'confirmed' then
    if coalesce(t.tx_hash, '') = coalesce(p_tx_hash, '') then return t; end if;
    raise exception 'Trade is already confirmed with a different transaction' using errcode = 'P0006';
  end if;

  if t.state <> 'submitted' then raise exception 'Trade is not awaiting settlement' using errcode = 'P0007'; end if;

  update public.voxel_trade_offers
  set state = 'confirmed',
      tx_hash = p_tx_hash,
      confirmed_at = p_confirmed_at,
      chain_id = p_chain_id,
      block_number = p_block_number,
      settlement_contract = p_settlement_contract,
      semantic_settlement_verified = true,
      settlement_event = p_settlement_event,
      token_id = p_token_id,
      updated_at = now()
  where id = p_trade_id
  returning * into updated;

  return updated;
end;
$$;

revoke all on function public.confirm_voxel_trade_settlement(text, text, timestamptz, bigint, bigint, text, text, text) from public;
grant execute on function public.confirm_voxel_trade_settlement(text, text, timestamptz, bigint, bigint, text, text, text) to service_role;

create index if not exists voxel_trade_offers_state_idx on public.voxel_trade_offers(state);
create index if not exists voxel_trade_offers_tx_hash_idx on public.voxel_trade_offers(tx_hash) where tx_hash is not null;

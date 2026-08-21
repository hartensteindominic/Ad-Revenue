-- Authoritative claim lifecycle: reserved -> submitted -> confirmed.
-- Requires service-role access from the server.

alter table public.voxel_claims drop constraint if exists voxel_claims_status_check;
alter table public.voxel_claims add constraint voxel_claims_status_check
  check (status in ('reserved', 'authorized', 'submitted', 'confirmed', 'rejected', 'expired', 'released'));

alter table public.voxel_claims add column if not exists expires_at timestamptz;
alter table public.voxel_claims add column if not exists transaction_hash text;
alter table public.voxel_claims add column if not exists token_id text;

create index if not exists voxel_claims_expiry_idx on public.voxel_claims(status, expires_at);
create unique index if not exists voxel_claims_tx_hash_unique
  on public.voxel_claims(transaction_hash) where transaction_hash is not null;

create or replace function public.reserve_voxel_claim(
  p_drop_id text,
  p_wallet_address text,
  p_claim_ticket text,
  p_expires_at timestamptz,
  p_client_distance_meters double precision
) returns table (claim_id uuid, claim_ticket text, status text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_drop public.voxel_drops%rowtype;
  v_claim public.voxel_claims%rowtype;
begin
  select * into v_drop from public.voxel_drops where id = p_drop_id for update;
  if not found then raise exception 'Drop not found'; end if;
  if v_drop.status not in ('active','scheduled') then raise exception 'Drop is not currently active'; end if;
  if v_drop.claimed_count >= v_drop.quantity then raise exception 'Drop is exhausted'; end if;

  select * into v_claim from public.voxel_claims
    where drop_id = p_drop_id and wallet_address = lower(p_wallet_address)
    for update;

  if found then
    if v_claim.status = 'confirmed' then
      return query select v_claim.id, v_claim.claim_ticket, v_claim.status, v_claim.expires_at;
      return;
    end if;
    if v_claim.status = 'submitted' then
      return query select v_claim.id, v_claim.claim_ticket, v_claim.status, v_claim.expires_at;
      return;
    end if;
    if v_claim.status in ('reserved','authorized') and v_claim.expires_at > now() then
      return query select v_claim.id, v_claim.claim_ticket, v_claim.status, v_claim.expires_at;
      return;
    end if;

    update public.voxel_claims
      set status = 'reserved', claim_ticket = p_claim_ticket,
          expires_at = p_expires_at, client_distance_meters = p_client_distance_meters,
          transaction_hash = null, token_id = null
      where id = v_claim.id
      returning id, voxel_claims.claim_ticket, voxel_claims.status, voxel_claims.expires_at
      into claim_id, claim_ticket, status, expires_at;
    return next;
    return;
  end if;

  insert into public.voxel_claims(drop_id,wallet_address,status,claim_ticket,client_distance_meters,expires_at)
    values (p_drop_id, lower(p_wallet_address), 'reserved', p_claim_ticket, p_client_distance_meters, p_expires_at)
    returning id, voxel_claims.claim_ticket, voxel_claims.status, voxel_claims.expires_at
    into claim_id, claim_ticket, status, expires_at;
  return next;
end;
$$;

create or replace function public.confirm_voxel_claim(
  p_claim_id uuid,
  p_token_id text
) returns table (claim_id uuid, drop_id text, wallet_address text, token_id text, claimed_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.voxel_claims%rowtype;
  v_drop public.voxel_drops%rowtype;
  v_new_count integer;
begin
  select * into v_claim from public.voxel_claims where id = p_claim_id for update;
  if not found then raise exception 'Claim reservation not found'; end if;
  if v_claim.status = 'confirmed' then
    return query select v_claim.id, v_claim.drop_id, v_claim.wallet_address, v_claim.token_id, null::integer;
    return;
  end if;
  if v_claim.status <> 'submitted' then raise exception 'Claim must be submitted before confirmation'; end if;

  select * into v_drop from public.voxel_drops where id = v_claim.drop_id for update;
  if not found then raise exception 'Drop not found'; end if;
  if v_drop.claimed_count >= v_drop.quantity then raise exception 'Drop exhausted'; end if;

  v_new_count := v_drop.claimed_count + 1;
  update public.voxel_claims
    set status = 'confirmed', token_id = p_token_id
    where id = v_claim.id and status = 'submitted';
  if not found then raise exception 'Claim confirmation race lost'; end if;

  update public.voxel_drops
    set claimed_count = v_new_count,
        status = case when v_new_count >= quantity then 'exhausted' else status end
    where id = v_drop.id;

  return query select v_claim.id, v_claim.drop_id, v_claim.wallet_address, p_token_id, v_new_count;
end;
$$;

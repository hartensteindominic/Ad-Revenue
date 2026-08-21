-- Recover abandoned finite-drop claim reservations.
-- Authorized reservations expire after 10 minutes unless submitted/confirmed.

alter table public.voxel_claims
  add column if not exists expires_at timestamptz;

update public.voxel_claims
set expires_at = created_at + interval '10 minutes'
where status = 'authorized' and expires_at is null;

alter table public.voxel_claims
  drop constraint if exists voxel_claims_drop_id_wallet_address_key;

create unique index if not exists voxel_claims_active_wallet_idx
  on public.voxel_claims(drop_id, wallet_address)
  where status in ('authorized', 'submitted', 'confirmed');

create index if not exists voxel_claims_expiry_idx
  on public.voxel_claims(drop_id, expires_at)
  where status = 'authorized';

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
  expired_count integer := 0;
begin
  select * into d from public.voxel_drops where id = p_drop_id for update;
  if not found then raise exception 'Drop not found' using errcode = 'P0002'; end if;

  -- Free stale reservations before checking remaining capacity.
  update public.voxel_claims
  set status = 'expired'
  where drop_id = p_drop_id
    and status = 'authorized'
    and expires_at is not null
    and expires_at <= now();
  get diagnostics expired_count = row_count;

  if expired_count > 0 then
    update public.voxel_drops
    set claimed_count = greatest(0, claimed_count - expired_count)
    where id = p_drop_id
    returning * into d;
  end if;

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

  insert into public.voxel_claims (
    drop_id, wallet_address, status, claim_ticket, client_distance_meters, expires_at
  )
  values (
    p_drop_id, lower(trim(p_wallet_address)), 'authorized', p_claim_ticket,
    p_client_distance_meters, now() + interval '10 minutes'
  )
  returning * into inserted_claim;

  update public.voxel_drops
  set claimed_count = claimed_count + 1
  where id = p_drop_id;

  return jsonb_build_object(
    'claim_id', inserted_claim.id,
    'claim_ticket', inserted_claim.claim_ticket,
    'claimed_count', d.claimed_count + 1,
    'quantity', d.quantity,
    'expires_at', inserted_claim.expires_at
  );
end;
$$;

revoke all on function public.reserve_voxel_drop_claim(text, text, text, double precision) from public;
grant execute on function public.reserve_voxel_drop_claim(text, text, text, double precision) to service_role;

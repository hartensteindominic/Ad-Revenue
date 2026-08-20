-- Voxel Vault: atomic claim reservations for multi-instance production.
-- This migration makes Supabase/Postgres the source of truth for finite drops.
-- Run after 002_drops_claims_trades.sql.

alter table public.voxel_drops
  add column if not exists reserved_count integer not null default 0 check (reserved_count >= 0);

alter table public.voxel_claims
  add column if not exists expires_at timestamptz;

create index if not exists voxel_claims_drop_status_idx
  on public.voxel_claims(drop_id, status);

create index if not exists voxel_claims_expiry_idx
  on public.voxel_claims(expires_at)
  where status = 'authorized' and expires_at is not null;

-- Atomically reserve one finite claim slot and create the wallet's claim ticket.
-- The unique(drop_id, wallet_address) constraint remains the replay/idempotency guard.
create or replace function public.reserve_voxel_claim(
  p_drop_id text,
  p_wallet_address text,
  p_claim_ticket text,
  p_client_distance_meters double precision,
  p_expires_at timestamptz
)
returns table (
  authorized boolean,
  reason text,
  claim_ticket text,
  status text,
  claimed_count integer,
  reserved_count integer,
  quantity integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.voxel_drops%rowtype;
  existing public.voxel_claims%rowtype;
begin
  if p_drop_id is null or length(trim(p_drop_id)) = 0 or length(p_drop_id) > 128 then
    return query select false, 'invalid_drop_id', null::text, null::text, 0, 0, 0;
    return;
  end if;

  if p_wallet_address !~* '^0x[0-9a-f]{40}$' then
    return query select false, 'invalid_wallet', null::text, null::text, 0, 0, 0;
    return;
  end if;

  select * into d
  from public.voxel_drops
  where id = p_drop_id
  for update;

  if not found then
    return query select false, 'not_found', null::text, null::text, 0, 0, 0;
    return;
  end if;

  if d.status not in ('active', 'scheduled')
     or (d.start_at is not null and now() < d.start_at)
     or (d.end_at is not null and now() > d.end_at) then
    return query select false, 'not_active', null::text, null::text, d.claimed_count, d.reserved_count, d.quantity;
    return;
  end if;

  select * into existing
  from public.voxel_claims
  where drop_id = p_drop_id and wallet_address = lower(trim(p_wallet_address))
  limit 1;

  if found and existing.status in ('authorized', 'submitted', 'confirmed') then
    return query select false, 'already_claimed', existing.claim_ticket, existing.status,
      d.claimed_count, d.reserved_count, d.quantity;
    return;
  end if;

  if d.claimed_count + d.reserved_count >= d.quantity then
    return query select false, 'exhausted', null::text, null::text,
      d.claimed_count, d.reserved_count, d.quantity;
    return;
  end if;

  if found then
    update public.voxel_claims
      set status = 'authorized',
          claim_ticket = p_claim_ticket,
          client_distance_meters = p_client_distance_meters,
          created_at = now(),
          expires_at = p_expires_at
    where id = existing.id;
  else
    insert into public.voxel_claims (
      drop_id, wallet_address, status, claim_ticket,
      client_distance_meters, expires_at
    ) values (
      p_drop_id, lower(trim(p_wallet_address)), 'authorized', p_claim_ticket,
      p_client_distance_meters, p_expires_at
    );
  end if;

  update public.voxel_drops
    set reserved_count = reserved_count + 1
  where id = p_drop_id;

  return query select true, 'authorized', p_claim_ticket, 'authorized',
    d.claimed_count, d.reserved_count + 1, d.quantity;
end;
$$;

-- Only the server's service role should call this function.
revoke all on function public.reserve_voxel_claim(text, text, text, double precision, timestamptz) from public;

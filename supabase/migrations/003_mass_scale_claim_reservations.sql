-- Voxel Vault: atomic claim reservations for multi-instance production.
-- Supabase/Postgres is the source of truth for finite drop capacity.

alter table public.voxel_drops
  add column if not exists reserved_count integer not null default 0 check (reserved_count >= 0);

alter table public.voxel_claims
  add column if not exists expires_at timestamptz;

create index if not exists voxel_claims_drop_status_idx
  on public.voxel_claims(drop_id, status);

create index if not exists voxel_claims_expiry_idx
  on public.voxel_claims(expires_at)
  where status = 'authorized' and expires_at is not null;

create or replace function public.release_expired_voxel_claims(p_drop_id text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer := 0;
begin
  with expired as (
    update public.voxel_claims
       set status = 'expired'
     where status = 'authorized'
       and expires_at is not null
       and expires_at < now()
       and (p_drop_id is null or drop_id = p_drop_id)
     returning drop_id
  ), counts as (
    select drop_id, count(*)::integer as n
    from expired
    group by drop_id
  )
  update public.voxel_drops d
     set reserved_count = greatest(0, d.reserved_count - counts.n)
    from counts
   where d.id = counts.drop_id;

  get diagnostics released = row_count;
  return released;
end;
$$;

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
  reserved_after integer;
begin
  if p_drop_id is null or length(trim(p_drop_id)) = 0 or length(p_drop_id) > 128 then
    return query select false, 'invalid_drop_id', null::text, null::text, 0, 0, 0;
    return;
  end if;
  if p_wallet_address !~* '^0x[0-9a-f]{40}$' then
    return query select false, 'invalid_wallet', null::text, null::text, 0, 0, 0;
    return;
  end if;
  if p_claim_ticket is null or length(p_claim_ticket) > 80 then
    return query select false, 'invalid_ticket', null::text, null::text, 0, 0, 0;
    return;
  end if;
  if p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '10 minutes' then
    return query select false, 'invalid_expiry', null::text, null::text, 0, 0, 0;
    return;
  end if;

  -- Clean expired reservations while holding the drop row lock below.
  perform public.release_expired_voxel_claims(p_drop_id);

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

  reserved_after := d.reserved_count;
  if d.claimed_count + reserved_after >= d.quantity then
    return query select false, 'exhausted', null::text, null::text,
      d.claimed_count, reserved_after, d.quantity;
    return;
  end if;

  if found then
    update public.voxel_claims
       set status = 'authorized', claim_ticket = p_claim_ticket,
           client_distance_meters = p_client_distance_meters,
           created_at = now(), expires_at = p_expires_at
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
   where id = p_drop_id
  returning reserved_count into reserved_after;

  return query select true, 'authorized', p_claim_ticket, 'authorized',
    d.claimed_count, reserved_after, d.quantity;
end;
$$;

revoke all on function public.reserve_voxel_claim(text, text, text, double precision, timestamptz) from public;
revoke all on function public.release_expired_voxel_claims(text) from public;

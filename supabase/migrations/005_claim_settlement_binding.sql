-- Bind a server-issued claim reservation to a specific on-chain NFT mint.
-- This closes the gap where a client could receive a valid claim ticket but the
-- database had no cryptographic/on-chain proof tying that ticket to the mint.

alter table public.voxel_claims
  add column if not exists tx_hash text,
  add column if not exists chain_id bigint,
  add column if not exists block_number bigint,
  add column if not exists settlement_contract text,
  add column if not exists settlement_event text,
  add column if not exists token_id text,
  add column if not exists semantic_settlement_verified boolean not null default false,
  add column if not exists confirmed_at timestamptz;

create unique index if not exists voxel_claims_tx_hash_idx
  on public.voxel_claims(tx_hash)
  where tx_hash is not null;

create index if not exists voxel_claims_settlement_idx
  on public.voxel_claims(settlement_contract, token_id)
  where token_id is not null;

create or replace function public.confirm_voxel_drop_claim(
  p_drop_id text,
  p_wallet_address text,
  p_claim_ticket text,
  p_tx_hash text,
  p_confirmed_at timestamptz,
  p_chain_id bigint,
  p_block_number bigint,
  p_settlement_contract text,
  p_settlement_event text,
  p_token_id text
)
returns public.voxel_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.voxel_claims%rowtype;
  updated public.voxel_claims%rowtype;
  normalized_wallet text := lower(trim(p_wallet_address));
begin
  select * into c
  from public.voxel_claims
  where drop_id = p_drop_id
    and wallet_address = normalized_wallet
    and claim_ticket = p_claim_ticket
  for update;

  if not found then
    raise exception 'Claim reservation not found' using errcode = 'P0002';
  end if;

  if c.status = 'confirmed' then
    if coalesce(c.tx_hash, '') = coalesce(p_tx_hash, '') then
      return c;
    end if;
    raise exception 'Claim is already confirmed with a different transaction' using errcode = 'P0006';
  end if;

  if c.status not in ('authorized', 'submitted') then
    raise exception 'Claim is not awaiting settlement' using errcode = 'P0007';
  end if;

  if c.expires_at is not null and c.expires_at <= now() then
    update public.voxel_claims
    set status = 'expired'
    where id = c.id;
    raise exception 'Claim reservation expired' using errcode = 'P0008';
  end if;

  update public.voxel_claims
  set status = 'confirmed',
      tx_hash = p_tx_hash,
      chain_id = p_chain_id,
      block_number = p_block_number,
      settlement_contract = p_settlement_contract,
      settlement_event = p_settlement_event,
      token_id = p_token_id,
      semantic_settlement_verified = true,
      confirmed_at = coalesce(p_confirmed_at, now())
  where id = c.id
  returning * into updated;

  return updated;
end;
$$;

revoke all on function public.confirm_voxel_drop_claim(text, text, text, text, timestamptz, bigint, bigint, text, text, text) from public;
grant execute on function public.confirm_voxel_drop_claim(text, text, text, text, timestamptz, bigint, bigint, text, text, text) to service_role;

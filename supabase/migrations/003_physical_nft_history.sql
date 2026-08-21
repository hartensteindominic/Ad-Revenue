create table if not exists public.voxel_objects (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid unique references public.assets(id) on delete set null,
  voxel_id text unique not null,
  nft_contract text,
  nft_token_id text,
  qr_payload text not null,
  object_type text not null default 'physical',
  condition text not null default 'unspecified',
  approximate_location geography(point, 4326),
  status text not null default 'listed' check (status in ('listed','checkout_pending','paid','physical_reserved','mint_pending','mint_submitted','mint_confirmed','handoff_pending','completed','disputed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.object_history (
  id uuid primary key default gen_random_uuid(),
  voxel_object_id uuid not null references public.voxel_objects(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  tx_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.physical_claims (
  id uuid primary key default gen_random_uuid(),
  voxel_object_id uuid not null references public.voxel_objects(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  handoff_method text not null check (handoff_method in ('pickup','delivery','fulfillment')),
  qr_verified_at timestamptz,
  chain_confirmed_at timestamptz,
  nft_tx_hash text,
  status text not null default 'pending' check (status in ('pending','reserved','qr_verified','mint_pending','confirmed','disputed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(voxel_object_id, order_id)
);

alter table public.voxel_objects enable row level security;
alter table public.object_history enable row level security;
alter table public.physical_claims enable row level security;

create policy "published voxel objects are public" on public.voxel_objects for select using (status in ('listed','paid','physical_reserved','mint_submitted','mint_confirmed','handoff_pending','completed'));
create policy "history is visible for listed objects" on public.object_history for select using (exists (select 1 from public.voxel_objects v where v.id = voxel_object_id and v.status <> 'disputed'));
create policy "buyers view own claims" on public.physical_claims for select using (buyer_id = auth.uid());

create index if not exists voxel_objects_asset_id_idx on public.voxel_objects(asset_id);
create index if not exists voxel_objects_status_idx on public.voxel_objects(status);
create index if not exists object_history_object_idx on public.object_history(voxel_object_id, created_at desc);
create index if not exists physical_claims_buyer_idx on public.physical_claims(buyer_id);

-- Purchase history is append-only by convention. Server-side service code should be the only writer.
-- Do not store card numbers or other payment credentials here.

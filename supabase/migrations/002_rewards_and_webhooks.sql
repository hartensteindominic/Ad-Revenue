create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  livemode boolean not null default false,
  processed_at timestamptz not null default now()
);

create table if not exists public.reward_campaigns (
  id text primary key,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','closed')),
  collector_bps integer not null default 0 check (collector_bps >= 0 and collector_bps <= 10000),
  creator_bps integer not null default 0 check (creator_bps >= 0 and creator_bps <= 10000),
  platform_bps integer not null default 0 check (platform_bps >= 0 and platform_bps <= 10000),
  sponsor_bps integer not null default 0 check (sponsor_bps >= 0 and sponsor_bps <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_campaign_split_total check (collector_bps + creator_bps + platform_bps + sponsor_bps = 10000)
);

create table if not exists public.reward_events (
  id text primary key,
  payment_event_id text not null references public.stripe_events(id) on delete restrict,
  campaign_id text not null references public.reward_campaigns(id) on delete restrict,
  collector_id uuid references auth.users(id) on delete set null,
  collector_wallet text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (currency = 'usd'),
  status text not null default 'pending' check (status in ('pending','claimable','paid','reversed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reward_events_payment_campaign_collector_idx
  on public.reward_events(payment_event_id, campaign_id, collector_id);
create index if not exists reward_events_collector_idx on public.reward_events(collector_id);
create index if not exists reward_events_status_idx on public.reward_events(status);

alter table public.stripe_events enable row level security;
alter table public.reward_campaigns enable row level security;
alter table public.reward_events enable row level security;

create policy "active campaigns are public" on public.reward_campaigns
  for select using (status = 'active');
create policy "users view own rewards" on public.reward_events
  for select using (collector_id = auth.uid());

comment on table public.stripe_events is 'Idempotency ledger for verified Stripe webhook events. Service role only for writes.';
comment on table public.reward_events is 'Auditable reward ledger. Service role owns status transitions.';

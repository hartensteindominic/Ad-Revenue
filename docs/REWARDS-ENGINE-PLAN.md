# Vault Rewards Engine

## Source of truth

Stripe webhook-confirmed payments and verified on-chain events are the only sources for financial rewards. Client-side callbacks never create earned balances.

## Accounting

All USD values are stored as integer cents. Campaign allocations are immutable after activation except through an auditable adjustment event.

## Flow

Payment confirmed → campaign identified → net eligible revenue calculated → configured split applied → pending reward ledger entries → reconciliation → claimable → payout.

## Safety

- Idempotency key: payment/event ID + campaign ID + allocation recipient.
- Never credit the same payment twice.
- Never mark pending funds as claimable before reconciliation.
- Never display unverified revenue as earnings.
- Keep sponsor disclosure visible wherever sponsored content is shown.
- ETH/on-chain purchases use separate accounting and never silently mix with USD ledger values.

## Collector economics

The system should maximize collector rewards within the campaign's configured economics, but never promise a fixed return. Rewards depend on verified campaign revenue, eligible actions, caps, fraud checks, and the campaign's published split.

## Roadmap

1. Ledger primitives and split validation.
2. Stripe Checkout + webhook ingestion.
3. Campaign allocation records and idempotent reward events.
4. Collector earnings dashboard with pending/claimable/paid states.
5. Payout/claim mechanism and reconciliation jobs.
6. Fraud/abuse controls and final financial audit.

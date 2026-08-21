# Voxel Vault Polish + Hardening Plan

## Phase 1 — Media reliability
- Route every NFT surface through one media stage.
- Auto-frame 3D bounds and preserve centered composition.
- Preload only visible/priority assets; lazy-load gallery items.
- Resolve IPFS through ordered gateways with timeout/fallback.
- Always provide 2D/procedural fallback instead of blank cards.

## Phase 2 — Financial integrity
- Verify Stripe signatures server-side.
- Treat webhook-confirmed paid sessions as the source of truth.
- Use idempotent payment/campaign/collector keys.
- Store USD in integer cents.
- Keep pending, claimable, and paid states separate.
- Never expose a client-calculated amount as earned money.
- Keep ETH accounting separate from USD accounting.

## Phase 3 — Sponsored campaigns
- Campaign records define published revenue allocation.
- Sponsored content is clearly disclosed.
- Revenue allocations are auditable and immutable after activation except through explicit adjustment events.
- No invented sponsor payments or reward balances in demo mode.

## Phase 4 — AI
- AI may classify, describe, rank, generate metadata, and flag anomalies.
- AI cannot authorize payouts, ownership, minting, or reward credits.
- Persist deterministic inputs/outputs where practical for reproducibility.
- Add timeouts and graceful fallback when AI is unavailable.

## Phase 5 — Discovery / Treasure
- Geolocation is permission-based.
- Treasure claims always require explicit wallet confirmation.
- Never auto-sign or auto-transfer assets.
- Anti-spoofing and cooldown checks precede claimability.

## Phase 6 — Production gate
- Build must pass.
- Smoke tests must pass.
- Contract addresses/network must be verified.
- Stripe webhook secret must be configured before USD checkout is live.
- Mobile/iPhone regression must pass.
- Main remains protected; merge only after review.

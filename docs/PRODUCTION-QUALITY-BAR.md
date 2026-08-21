# Voxel Vault Production Quality Bar

## Product
- Simple, playful, futuristic shell remains intact.
- NFT media is centered in every surface.
- 3D models auto-frame; 2D/video assets remain contained and responsive.
- Loading and failure states are branded and useful, never blank.
- One wallet identity is shared across Marketplace, My Vault, Vault Spots, Atlas, Hunts, and Profile.

## Money
- USD is integer cents internally.
- Stripe signatures are verified server-side.
- Webhooks are idempotent and are the source of payment truth.
- Rewards cannot move from pending to claimable without reconciliation.
- Rewards cannot be paid twice.
- ETH and USD accounting are separate.
- Sponsored revenue allocations are disclosed and auditable.

## AI
- AI outputs are advisory, reproducible where practical, and bounded by validation gates.
- AI cannot authorize financial or ownership actions.
- Provider failure degrades gracefully.
- Inputs are sanitized and secrets never reach the client.

## Discovery
- Location requires permission.
- Proximity creates claim intent only.
- Wallet signing is always explicit.
- Cooldowns and anti-spoofing checks run before claimability.

## Release gate
- `npm run build` passes.
- `node scripts/test-rewards-engine.mjs` passes.
- Existing universal smoke tests pass.
- Production deployment is inspected after build.
- Mobile/iPhone layout is checked.
- Main remains protected and changes land through reviewed feature work.

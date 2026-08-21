# Review → Plan → Build → Polish / Harden

## Current assessment

The feature branch has a Next.js 15 app, ethers/Three.js, Stripe, Supabase, contract tooling, rewards primitives, and an existing web-build workflow. The financial layer now has signed webhook verification and a durable rewards schema, but the webhook must remain server-authoritative and idempotent. The canonical NFT media stage still needs to be integrated across every major NFT surface.

## Priority A: financial correctness
- Persist verified Stripe events before reward creation.
- Keep rewards in pending until campaign and amount reconciliation succeeds.
- Enforce USD cents internally.
- Prevent duplicate payment/reward credits.
- Keep ETH accounting separate.
- Add refund/reversal handling before enabling payouts.

## Priority B: media reliability
- One canonical media resolver for GLB/GLTF/IPFS/image/video.
- Automatic bounds-based framing and centering.
- Lazy loading and disposal of Three.js resources.
- Deterministic procedural fallback when remote media fails.
- No blank card state.

## Priority C: product polish
- Preserve the current 3D-centered shell.
- Subtle starfield and star-logo only.
- Consistent loading, empty, error, and wallet states.
- One wallet identity across major surfaces.
- Mobile-first touch targets and responsive stages.

## Priority D: autonomous quality
- Every branch runs rewards tests, universal smoke tests, dependency audit, and production build.
- Cancel superseded CI runs.
- Use Vercel previews for visual/runtime verification.
- Do not auto-merge into `main` without a reviewed release gate.

## Priority E: AI boundaries
- AI may classify, generate, rank, and detect anomalies.
- AI cannot authorize payouts, ownership changes, wallet signing, or irreversible contract actions.
- Provider outages degrade to deterministic rules/fallbacks.

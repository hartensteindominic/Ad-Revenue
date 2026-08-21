# Release Candidate

This feature branch is a release candidate only after CI and Vercel preview checks are green.

Required before merge to `main`:
- Rewards regression passes
- Universal smoke tests pass
- Dependency audit passes
- Next.js production build passes
- Vercel preview responds successfully
- Production metadata uses `https://voxelvault.io`
- NFT media surfaces have a real-media path and deterministic fallback
- Stripe webhook events are idempotent
- Refund/reversal behavior is implemented before reward payout is enabled

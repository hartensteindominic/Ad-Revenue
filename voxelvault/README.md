# VoxelVault

Creator-first marketplace for game-ready, VR-ready, voxel and 3D-printable digital assets.

## MVP direction

- Buyer storefront with asset discovery and filters
- 3D preview-ready listing model
- Creator storefronts
- Secure digital delivery
- Stripe Checkout + Connect for marketplace payments/payouts
- Supabase Auth/Postgres/Storage
- Server-side metadata extraction and AI-assisted listing generation
- License-aware purchases
- Creator sales dashboard

## Revenue model

Initial marketplace fee target: 20% of qualifying sales. Optional creator Pro subscription can be added after marketplace validation.

## Production architecture

Frontend: Next.js + TypeScript

Backend: Next.js server routes / server actions

Auth + DB + object storage: Supabase

Payments + creator payouts: Stripe Checkout + Stripe Connect

AI listing assistant: OpenAI API, server-side only

Deployment: Vercel

## Security requirements

- Never commit API keys or service-role credentials.
- Keep paid asset originals in private object storage.
- Issue short-lived signed download URLs after verified payment.
- Verify Stripe webhook signatures server-side.
- Enforce ownership and seller permissions with database RLS.
- Treat uploaded model files as untrusted input.

## Roadmap

1. Production Next.js application shell
2. Supabase authentication and database migrations
3. Creator onboarding and asset upload pipeline
4. Asset metadata extraction and 3D preview generation
5. Stripe Checkout and Connect payouts
6. Secure purchased-file delivery
7. Reviews, favorites and creator profiles
8. AI listing assistant
9. Admin moderation and copyright/report workflow
10. Analytics and marketplace SEO

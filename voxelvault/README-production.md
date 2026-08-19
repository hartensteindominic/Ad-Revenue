# VoxelVault production commerce

This branch contains the production commerce foundation. It deliberately keeps secrets out of source control.

## Required environment variables

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## Payment architecture

1. The client requests `/api/checkout` with an asset ID and server-validated pricing data.
2. The server creates Stripe Checkout and, when the seller has a connected Stripe account, routes the payment through Stripe Connect with a 20% application fee.
3. Stripe's signed webhook is the source of truth for payment completion.
4. A production Supabase service-role handler should create the order and download entitlement idempotently from the webhook event.
5. Downloads must be generated from private storage using short-lived signed URLs only after an entitlement check.

## Important launch requirement

The webhook route currently verifies Stripe signatures and logs the event. It must be connected to the Supabase service-role persistence layer before accepting real customer payments. Do not treat the success URL as proof of payment.

## Security

Never commit Stripe, Supabase service-role, or other private credentials. Use the hosting provider's encrypted environment variables.

# WorkflowForge

Production-oriented AI SaaS for small-business marketing operations.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + Postgres + Row Level Security
- OpenAI Responses API
- Stripe subscriptions + webhooks
- Vercel deployment

## Local setup

```bash
cd workflowforge
npm install
cp .env.example .env.local
npm run dev
```

Configure the variables in `.env.local`. Never commit secrets.

## Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable Email/OTP auth and set the redirect URL to `<APP_URL>/auth/callback`.

## OpenAI
Set `OPENAI_API_KEY` as a server-side environment variable. The browser never receives it.

## Stripe
Create recurring prices for Pro and Studio and set their IDs. Configure the webhook endpoint:
`/api/stripe/webhook`

Subscribe to `checkout.session.completed` and `customer.subscription.deleted` at minimum. For production billing, also synchronize subscription updates and period-end status events.

## Deploy
Import the repository into Vercel with the `workflowforge` root directory and add all `.env.example` values as encrypted Vercel environment variables.

## Product status
This branch is the production MVP foundation. Authentication, database persistence, AI generation, Stripe checkout/webhook handling, protected dashboard routes, and deployment configuration are wired. Before public launch, add automated tests, rate limiting, abuse protection, complete subscription lifecycle synchronization, transactional email, and a production privacy/terms review.

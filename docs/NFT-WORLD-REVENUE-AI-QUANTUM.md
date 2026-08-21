# NFT World + Revenue + AI + Quantum Layer

## Product rule

Voxel Vault stays free for ordinary collectors. Sponsored experiences are clearly disclosed. The front end remains playful and collector-first.

## Revenue flow

1. A sponsor funds a USD campaign through Stripe Checkout.
2. The campaign receives a deterministic ID and budget in cents.
3. Campaign allocation is expressed in basis points and must total 10,000.
4. A verified eligible discovery can reserve a reward quote.
5. Actual payment settlement and NFT ownership remain authoritative server/on-chain flows.
6. The current ledger does **not** pretend to move funds. Production settlement must persist the verified event in the existing reward infrastructure.

Default demo allocation: 70% collector, 10% Vault owner, 20% protocol. This is configuration, not a promise to sponsors or users.

## NFT World

The world catalog adds deterministic collectible families, materials, rarities, creators and sponsored discovery metadata. It is intentionally independent from the canonical marketplace catalog so the existing homepage can remain stable while the new world is evaluated at `/world`.

## AI

The World Director ranks opportunities and produces deterministic generation briefs. It is bounded advisory intelligence. It cannot sign wallets, move funds, change campaign budgets or bypass settlement.

## Quantum

The World Optimizer is a quantum-inspired optimization adapter. It currently runs a deterministic simulator so tests are reproducible. A real quantum provider can be connected behind the adapter without changing the product contract. No browser mining and no claim of quantum hardware execution are made.

## Security boundaries

- Sponsored content is never secretly disguised as organic content.
- Stripe secrets remain server-only.
- Campaign budgets are integer USD cents.
- Checkout uses an idempotency key.
- Rewards require verified settlement before crediting.
- AI cannot execute financial actions.
- Quantum code cannot execute financial actions.
- Exact private locations should not be written to public blockchain state.

## Release gate

PLAN → REVIEW EVERYTHING → IMPLEMENT → UNIT TEST → BUILD → SECURITY REVIEW → VERCEL PREVIEW → BROWSER/VISUAL QA → FIX → RETEST → APPROVE → MERGE MAIN → VERCEL PRODUCTION → VERIFY LIVE SHA → PRODUCTION SMOKE TEST → MONITOR → ROLLBACK OR GREEN.

**Green build never means finished.**

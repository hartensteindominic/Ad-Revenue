# Voxel Vault: First $1,000 Bootstrap Plan

## Goal

Use the first $1,000 as controlled growth capital, not as a single speculative deposit. The goal is to prove that sponsored collectibles can fund collector rewards, creators, infrastructure, and future growth before committing larger sums.

## Allocation

| Bucket | Amount | Purpose |
|---|---:|---|
| Collector reward + sponsored-drop pool | $300 | Seed the first campaigns so collectors have a real reason to participate |
| Reliability / infrastructure | $200 | Hosting, database capacity, monitoring, storage and operational headroom |
| Creator + sponsor acquisition | $200 | Small creator bounties, campaign pilots and sponsor-facing launch incentives |
| Security review budget | $200 | Independent code/contract review; this is a review budget, not a claim that a professional audit can be purchased for $200 |
| Emergency reserve | $100 | Unexpected infrastructure, transaction, incident or recovery costs |
| **Total** | **$1,000** | |

## Release gates

Do not spend the entire pool immediately.

### Stage 0: $0-$100

- Keep production contracts on testnet while the vertical slice is verified.
- Confirm the claim database migration and atomic reservation path.
- Confirm production build, sponsored tests, funding tests and Solidity compilation all pass.

### Stage 1: $100-$300

- Seed a small sponsored collectible campaign.
- Keep edition counts deliberately small.
- Measure claim completion, repeat participation, creator earnings, sponsor conversion and infrastructure cost per active collector.

### Stage 2: $300-$600

Only increase the campaign/reward pool after the first campaign demonstrates real usage.

- Add more collectible types.
- Increase drop capacity gradually.
- Improve sponsor reporting using aggregate metrics only.
- Keep campaign funds isolated and attributable.

### Stage 3: $600-$1,000

Spend the remaining capital only when the system is demonstrating repeatable demand.

- Expand the creator pipeline.
- Improve discovery and mobile UX.
- Increase infrastructure capacity only when measurements justify it.
- Obtain an appropriate independent security review before meaningful mainnet funds are exposed.

## Scale rule

The platform should scale in layers:

1. **Browser:** optimized rendering, lazy loading, bounded payloads and graceful failure states.
2. **Next.js:** dynamic routes, no-store behavior for claim mutations, bounded responses and explicit server/client boundaries.
3. **Postgres:** atomic finite-capacity reservations, uniqueness constraints and indexed claim paths.
4. **Blockchain:** campaign escrow, reservation state, ownership and settlement are authoritative on-chain.
5. **Operations:** monitoring, alerting, reconciliation and a controlled emergency procedure.

Never rely on one Vercel function instance's memory for production inventory, claims, balances or ownership.

## The earning loop

Voxel Vault is intended to make legitimate participation economically useful during spare moments, including mobile use during breaks. The platform should reward actual value creation or participation, not passive ad-view spam.

Examples of legitimate earning actions:

- discovering a sponsored collectible;
- completing a real location-based or digital hunt;
- creating an approved collectible;
- referring qualified creators or sponsors;
- participating in marketplace activity where the economics support it.

Sponsored collectibles must remain clearly disclosed as sponsored. The collectible itself can be the advertising medium, including a 3D object, without pretending sponsorship does not exist.

## $1,000 success criterion

The first $1,000 is successful if it helps Voxel Vault reach a measurable loop where:

**sponsor funding → collectible quality → collector participation → creator rewards → platform revenue → larger future campaigns**

The target is not to burn $1,000 quickly. The target is to make the next dollar of growth increasingly funded by the ecosystem itself.

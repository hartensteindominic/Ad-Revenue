# Voxel Vault vNext — Canonical Architecture

Status: canonical planning and implementation contract
Date: 2026-08-21

## North star

**Walk. Discover. Collect. Earn.**

The majority of the player experience is a proximity-based discovery loop. The player does not need to hold up a camera to participate.

## Player experience

1. Open the app.
2. See nearby signals and optional route guidance.
3. Walk toward a drop.
4. Enter the collection zone.
5. Tap **COLLECT**.
6. Complete a tiny optional micro-interaction when the drop calls for one.
7. Receive the collectible and any eligible reward after authoritative settlement.

### Camera policy

- Camera is **never required** for ordinary collection.
- Camera/AR is an optional enhancement called **Peek**.
- The default collection interaction keeps the phone in a natural position.
- Location permission may be requested for proximity discovery; camera permission is independent.
- A camera-denied user must still be able to discover and collect ordinary compatible drops.

## Two drop economies

### Natural Vaults

AI-assisted, unbranded collectibles that keep the world populated when no sponsor is active.

AI may propose rarity, lore, visual direction, mutations, quests and spawn candidates. Deterministic rules and trusted services decide eligibility and ownership.

### Sponsored Hunts

Businesses fund real-world discovery campaigns. A sponsor purchases a campaign, not intrusive banner inventory. The campaign defines its collectible, discovery zone, schedule, supply and economic rules.

The canonical economic model for sponsored campaigns is **50% player / 25% platform / 20% global pool / 5% creator**, but percentages must live in one canonical campaign schema and be validated server-side and on-chain before any production deployment.

## Trust boundaries

### Client

Responsible for:

- rendering the world
- requesting permissions
- showing distance as UX
- collecting sensor inputs
- initiating explicit user actions

The client is **not authoritative** for ownership, money, claim counts or proximity eligibility.

### AI

AI is assistive. It may recommend, generate, score and explain. It must not independently authorize irreversible ownership or treasury actions.

### Proximity service

A trusted proximity service/oracle converts sensor/location evidence into a short-lived signed proof. Raw GPS must not be written to public chain state.

### Backend

Responsible for authentication, rate limits, reservations, voucher issuance, state transitions and observability.

### Blockchain

Responsible for final ownership, replay protection, campaign escrow accounting and settlement events.

## Claim state machine

```text
DISCOVERED
   ↓
ELIGIBLE
   ↓
RESERVED
   ↓
AUTHORIZED
   ↓
SUBMITTED
   ↓
CONFIRMED
   ↓
OWNED
   ↓
REWARDED
```

Failure states must be recoverable. A failed transaction must not permanently consume a user claim merely because an authorization request succeeded.

## Privacy

- Never put raw latitude/longitude on-chain.
- Prefer coarse spatial identifiers for public discovery.
- Keep precise location ephemeral and purpose-limited.
- Camera permission is separate from location permission.
- Do not expose another user's precise location through APIs, logs or analytics.

## 3D policy

3D is progressive enhancement:

- lightweight marker first
- lazy GLB preview second
- full interactive 3D only when useful
- graceful non-WebGL fallback always

## AI branches

- World Director
- Quest Master
- Vault Artist
- Anti-Cheat scoring
- Pricing intelligence
- Concierge route recommendations
- Brand campaign assistant
- Moderation
- Weather and environment mutations

## Quantum-ready branches

Quantum functionality must be optional infrastructure, never a production availability dependency.

- QRNG adapter
- route optimization research adapter
- post-quantum cryptography migration layer
- Qiskit research sandbox

If a quantum provider disappears, the game must continue normally.

## Revenue architecture

Campaign budget and platform revenue are separate accounting concepts.

```text
Sponsor funding
      ↓
Campaign escrow
      ↓
Claim settlement
 ┌────┼─────┬─────┐
Player Platform Global Creator
```

Every settlement needs an auditable receipt and an explicit accounting state.

## Reconciliation rule

A feature is only marked **implemented** when source code, configuration, tests and deployment behavior support it. A plan, README or generated scaffold does not make a feature production-ready.

## Release gates

Before a production release:

- no known critical security findings
- build succeeds
- contract compilation succeeds
- unit tests succeed
- claim/reward invariants are tested
- mobile/WebGL checks succeed
- camera-denied collection path succeeds
- location-denied fallback is honest and non-destructive
- 3D failure fallback succeeds
- ownership UI only changes after authoritative confirmation
- deployment is inspected after build

## Build order

### Slice A — reconciliation and player shell

Freeze this document, normalize drop/claim states, make camera optional, remove unsafe client-authoritative language, consolidate stale planning documents.

### Slice B — authoritative collection

Build reservation state transitions and signed proximity proof interfaces without putting raw GPS on-chain.

### Slice C — sponsored economy

Implement campaign escrow and settlement only after contract invariants and economic rules are finalized and tested.

### Slice D — gasless ownership

Integrate a real ERC-4337 provider/paymaster behind a stable collection service interface.

### Slice E — natural world

Add AI-assisted natural vault generation, weather mutations and adaptive quests.

### Slice F — creator and brand tools

Self-serve sponsored campaign creation, asset validation, reporting and receipts.

### Slice G — advanced systems

Fusion, Reactor, guild convergence, lineage/indexing, AR Peek, quantum-ready adapters and route optimization.

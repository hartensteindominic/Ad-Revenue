# Voxel Vault Master Build Plan

## North star

Voxel Vault is a universal network for realistic, interactive 3D digital objects that can be created, owned, displayed, discovered, transferred, traded, and used across compatible platforms.

**The NFT is the ownership layer. The 3D object is the product. Sponsorship is the funding layer.**

## Non-negotiable product rules

1. Preserve the existing premium Voxel Vault visual identity and working wallet/payment paths unless a change is explicitly required.
2. Never label an integration as live when it is only a compatibility profile or prototype.
3. Never represent local UI state as blockchain ownership.
4. Phone-to-phone transfer may initiate a transaction, but the recipient wallet must explicitly authorize it.
5. Public drop zones must not require broadcasting a user's private location.
6. Mobile browsing must remain lightweight; load a heavy 3D renderer only when needed and dispose it when closed.
7. Every major feature must have loading, empty, rejection, failure, and success states.
8. Experimental architecture stays on feature branches until the full vertical slice passes review.
9. Sponsored content must be disclosed. Native advertising is allowed; deceptive advertising is not.
10. Sponsor money may fund rewards, creator economics and infrastructure, but sponsorship can never bypass wallet authorization or blockchain settlement.
11. Bootstrap funding is treated as runway, not as permanent fake revenue. The system must measure when sponsor and marketplace revenue can sustainably replace it.
12. No fake scarcity, fake volume, fake users, fake claims, fake ownership or fabricated performance metrics.

## Architecture

### Universal collectible

One schema supports procedural, AI-assisted, and creator-uploaded objects.

Core fields include identity, family, subtype, creation mode, seed, rarity, traits, reality basis, 3D asset references, creator, blockchain identity, ownership, platform profiles, provenance, and optional sponsorship provenance.

### Realistic generation

Object families have category-specific generation grammars. Randomness changes valid components, materials, finishes, proportions, details, and rarity without producing arbitrary trait soup.

### Creator Studio

Generate or upload GLB/GLTF -> validate -> preview -> optimize -> metadata -> traits/rarity -> mint configuration -> publish.

### Ownership

Wallet state is derived from the chain. My Vault is a presentation layer over verified ownership.

### Transfer

QR/deep-link/NFC-compatible handoff creates a transaction intent. The wallet signs. The blockchain confirms. No private keys or seed phrases are ever requested.

### Trading

Transfers, sales, offers, swaps, bundles, and auctions are separate concepts. Offers use explicit state transitions and recipient authorization.

### Drops

A creator or sponsor can publish a public discovery zone, schedule it, define claim limits, and attach a collection. The system validates that a claimant is inside the public drop zone before creating a claim intent.

### Physical discovery

Bluetooth is an enhancement where supported. QR remains a first-class cross-platform discovery path. NFC can be an enhancement on compatible devices. Physical proximity identifies a drop; it never directly grants ownership.

### Game layer

Quests, collections, events, rarity hunts, seasonal drops, and sponsored real-world campaigns build engagement around genuinely owned objects.

### Sponsored collectibles

A sponsor funds a campaign that creates genuinely collectible 3D/2D objects. The object is art-first and can be branded, useful, limited, location-aware or quest-linked. Sponsorship is part of provenance and is disclosed without overwhelming the collecting experience.

Campaign economics are explicit: creator share, collector-reward pool, platform share and operating reserve. Reward capacity is funded before a campaign is launched.

See `docs/SPONSORED-COLLECTIBLES-REVENUE-PLAN.md`.

### AI

AI Curator helps collectors discover and organize. AI Creator helps creators propose collections and variations. AI must not silently mint or spend funds.

### Interoperability

The Voxel collectible is canonical. Platform adapters expose compatibility states such as draft, validated, submitted, published, and verified.

## First vertical slice

Prove the same pipeline with three unrelated objects:

- camera
- robot
- skateboard

Each must use the same universal collectible, 3D presentation, metadata, wallet, ownership, transfer, trade, drop, discovery, and claim architecture.

The skateboard is not the product. It is only one test category.

## Sponsored vertical slice

Prove one complete commercial loop:

**Sponsor funds campaign → creator produces 3D object → disclosed sponsored collectible publishes → user discovers it via QR/Bluetooth → 3D object is revealed → wallet authorizes claim → blockchain settles → server verifies settlement → collector owns object → campaign records verified claim → reward pool reconciles → sponsor receives transparent campaign metrics.**

No sponsor dashboard or ad marketplace is considered complete until this loop is trustworthy.

## Build sequence

1. Universal collectible schema ✅
2. Category-aware realistic generation ✅
3. 3D asset pipeline (partial)
4. Creator Studio (partial)
5. Wallet ownership verification (existing foundation)
6. My Vault (partial)
7. Transfer protocol (QR / deep-link handoff UI ✅)
8. Trading engine ✅
9. Marketplace lifecycle (existing foundation)
10. Random collection generation
11. Drop Engine ✅
12. Discovery map ✅ (UI + geolocation + placement)
13. Game mechanics
14. AI Curator
15. AI Creator
16. Platform adapters
17. Verified external-platform integrations
18. AR
19. Sponsored/event drops
20. Sponsored collectible economics and provenance
21. Campaign funding / reward accounting
22. Sponsor analytics based on verified events
23. End-to-end commercial vertical slice
24. Adversarial security review
25. Scale, observability, and optimization

## Review matrix

Every major milestone is reviewed through 100+ changing lenses covering visual design, responsive behavior, WebGL lifecycle, asset validation, wallet states, blockchain failures, marketplace states, trading authorization, creator workflows, drops, AI boundaries, interoperability claims, sponsorship disclosure, campaign economics, security, performance, accessibility, abuse resistance, observability, and human usability.

A review is only useful when it attempts to break the implementation. Repeating a checklist without changing the test lens does not count as another review.

Every vertical slice gets:

- happy-path tests
- failure-path tests
- adversarial tests
- replay tests
- stale-state tests
- permission tests
- mobile tests
- accessibility tests
- performance tests
- trust-language review

## Current implementation status (2026-08-20)

The project has universal collectible, category-aware generation, drop, discovery and trade foundations, plus transaction verification and adversarial proximity work on feature branches.

The new `feature/sponsored-collectibles` branch adds the sponsor-funded collectible economics engine and its tests, plus this revenue/trust architecture.

Still required before calling the product production-ready:

- server-side claim validation + anti-replay fully integrated with the UI
- real on-chain settlement for claims and trades
- persistent drop storage
- full 3D asset generation pipeline for the vertical-slice objects
- end-to-end vertical slice proof
- sponsored collectible UI and provenance presentation
- funded campaign settlement and payout reconciliation
- live observability
- clean Vercel build/deployment

Do not merge to main until the vertical slice is proven and Vercel builds are clean.

# Voxel Vault Master Build Plan

## North star

Voxel Vault is a universal network for realistic, interactive 3D digital objects that can be created, owned, displayed, discovered, transferred, traded, and used across compatible platforms.

The NFT is the ownership layer. The 3D object is the product.

## Non-negotiable product rules

1. Preserve the existing premium Voxel Vault visual identity and working wallet/payment paths unless a change is explicitly required.
2. Never label an integration as live when it is only a compatibility profile or prototype.
3. Never represent local UI state as blockchain ownership.
4. Phone-to-phone transfer may initiate a transaction, but the recipient wallet must explicitly authorize it.
5. Public drop zones must not require broadcasting a user's private location.
6. Mobile browsing must remain lightweight; load a heavy 3D renderer only when needed and dispose it when closed.
7. Every major feature must have loading, empty, rejection, failure, and success states.
8. Experimental architecture stays on feature branches until the full vertical slice passes review.

## Architecture

### Universal collectible

One schema supports procedural, AI-assisted, and creator-uploaded objects.

Core fields include identity, family, subtype, creation mode, seed, rarity, traits, reality basis, 3D asset references, creator, blockchain identity, ownership, platform profiles, and provenance.

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

A creator can publish a public discovery zone, schedule it, define claim limits, and attach a collection. The system validates that a claimant is inside the public drop zone before creating a claim intent.

### Game layer

Quests, collections, events, rarity hunts, seasonal drops, and sponsored real-world campaigns build engagement around genuinely owned objects.

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

## Build sequence

1. Universal collectible schema
2. Category-aware realistic generation
3. 3D asset pipeline
4. Creator Studio
5. Wallet ownership verification
6. My Vault
7. Transfer protocol
8. Trading engine
9. Marketplace lifecycle
10. Random collection generation
11. Drop Engine
12. Discovery map
13. Game mechanics
14. AI Curator
15. AI Creator
16. Platform adapters
17. Verified external-platform integrations
18. AR
19. Sponsored/event drops
20. Scale, observability, and optimization

## Review matrix

Every major milestone is reviewed through 100 lenses covering visual design, responsive behavior, WebGL lifecycle, asset validation, wallet states, blockchain failures, marketplace states, trading authorization, creator workflows, drops, AI boundaries, interoperability claims, security, performance, accessibility, and human usability.

A review is only useful when it attempts to break the implementation. Repeating a checklist without changing the test lens does not count as another review.

## Current implementation status

The repository already has a premium 3D-first showcase and mobile GPU-safety work. The current feature branch adds the foundational universal collectible schema, category-aware generation grammars, drop/discovery primitives, and a trade state machine without replacing the existing homepage.

Next implementation work should wire these primitives into the actual UI and existing contract/wallet layer, then validate the three-object vertical slice before expanding the catalog.

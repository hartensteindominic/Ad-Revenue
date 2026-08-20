# Voxel Vault Universal Collectible Roadmap

## North star

Voxel Vault is a network for realistic, interactive 3D digital objects that can be created, owned, displayed, discovered, transferred, traded, and eventually used across compatible worlds.

The NFT is the ownership mechanism. The 3D object is the product.

## Build order

1. Universal collectible schema
2. Category-aware realistic generation rules
3. GLB/GLTF asset validation and optimization pipeline
4. Creator Studio
5. Blockchain ownership verification
6. My Vault
7. Secure transfer handoff
8. Offers, swaps, sales, and auctions
9. Marketplace integration
10. Deterministic collection generator
11. Public Drop Engine
12. Discovery map and claim flow
13. Quests, collections, events, and achievements
14. AI Curator
15. AI Creator
16. Platform compatibility adapters
17. Verified external-world integrations
18. AR presentation
19. Sponsored/event drops
20. Scale, observability, security hardening, and performance

## Architecture rules

- Preserve the existing Voxel Vault visual identity unless a change materially improves usability or performance.
- Do not represent catalog presence as blockchain ownership.
- Do not claim an external platform integration until it is actually validated.
- Keep financial rails separate from collectible identity and ownership.
- Treat mobile WebGL lifecycle and renderer cleanup as production requirements.
- Keep generated, AI-assisted, and human-authored assets on the same universal collectible schema.
- Build category-specific generation grammars instead of one generic random trait soup.
- Prove universality with multiple unrelated categories before expanding the catalog at scale.

## First vertical slice

Prove the same pipeline with three unrelated object categories:

- camera
- robot
- skateboard

Each must be able to move through the same conceptual lifecycle:

Generate -> 3D -> metadata -> mint -> wallet ownership -> My Vault -> inspect -> transfer -> trade -> drop -> discover -> claim.

The three categories are test fixtures, not the product's permanent identity.

## Quality gate

Before promotion to production, review the system across visual design, responsive/mobile behavior, 3D/WebGL lifecycle, wallet state, blockchain state, marketplace flows, creator flows, trading, drops, AI boundaries, interoperability claims, security, performance, and human usability.

Repeat the review matrix after every major architectural change.

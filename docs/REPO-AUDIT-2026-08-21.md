# Voxel Vault repository review — 2026-08-21

## Review scope

Reviewed the repository inventory across application routes, 3D components, generation/collectible libraries, blockchain APIs, drops/hunts, map/atlas components, payment routes, CI workflows, and the current AI/hybrid-drop branches.

## Findings fixed in this branch

### 1. Duplicate Visual DNA sources
The canonical source is `lib/universalCollectible.js`. The earlier AI branch introduced a second `lib/assetDNA.js` implementation with different palettes, mutation budgets, and output shape. This branch removes the duplicate and makes the hook and asset director consume `generateVisualDNA()` from the universal collectible engine.

### 2. Generation layers were disconnected
The repository already had realistic generation rules in `lib/generation/realisticRules.js`, plus the procedural voxel generator and the universal collectible schema. The new `lib/ai/assetPlanner.js` connects those layers into a deterministic asset plan before any external AI provider is invoked.

### 3. AI provider boundary
`app/api/ai/asset-plan/route.js` is server-only and returns a provider-ready payload. No provider key is exposed to browser code. A future provider can be configured through a server environment variable without changing the client renderer.

### 4. Determinism and review gate
Asset plans are deterministic for the same seed/family/rarity. AI remains assistive, and minting remains a separate reviewed step.

## Existing architecture observations

- `Fast3DStage` already follows a useful preview-first pattern before the heavier 3D viewer.
- `VoxelViewer` already contains intelligent bounding-box framing for real GLTF/GLB assets and a procedural voxel fallback.
- `lib/nft-engine.js` provides a large procedural voxel generator.
- `lib/generation/realisticRules.js` provides category-specific material/subtype/trait grammar.
- `lib/universalCollectible.js` provides the ownership-agnostic collectible schema and canonical Visual DNA.
- Atlas, discovery, scavenger-hunt, drop, checkout, Stripe, and blockchain routes exist and should remain separate from asset generation concerns.

## Follow-up

The next integration step is to consume the asset plan in the 3D generation/render pipeline, cache generated GLB/GLTF results by collectible fingerprint, and add provider execution only after the plan has passed validation/review.

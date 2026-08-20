# Premium 3D NFT Engine

This branch is the quality-first 3D evolution of the Voxel Vault collection.

## Quality contract

- Actual `.glb` asset for every edition, not only a 2D image.
- Deterministic SHA-256 DNA from token ID + engine version + generated geometry.
- Rarity changes geometry complexity and signature components, not merely metadata.
- Common through Legendary must remain visually distinct.
- Browser marketplace must load the actual GLB asset through `animation_url`/asset URL.
- 1024px preview image is generated from the same deterministic voxel data.
- Prototype batches are inspected before scaling to 100,000 editions.

## Prototype first

Generate 50 editions:

```bash
python3 scripts/premium_3d_engine.py --start 1 --end 50 --output premium-3d-preview
```

The prototype intentionally does **not** mint or upload anything. It creates:

- `glb/` real GLB files
- `images/` 1024px PNG previews
- `metadata/` ERC-721/OpenSea-compatible metadata
- `manifest.json` tying token IDs, rarity, DNA, image, and GLB together

## Scaling rule

Do not generate the full 100,000 collection until the prototype passes the visual quality review. The final rarity allocation remains Common 60,000, Uncommon 25,000, Rare 10,000, Epic 4,000, Legendary 1,000.

## Architecture

`token ID -> deterministic DNA -> voxel geometry -> GLB + render -> metadata -> IPFS -> Voxel Vault viewer`

The existing storefront layout should remain intact. The viewer should consume the actual generated GLB rather than substituting the old procedural demo archetypes.

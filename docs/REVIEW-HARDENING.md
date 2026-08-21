# Voxel Vault hardening review

## AI
- Universal Collectible remains the canonical deterministic DNA source.
- AI planning is deterministic and provider-agnostic.
- Generation requests must pass the quality gate before being treated as mint-ready.
- Creative directions are bounded and secret-like content is rejected.
- Provider credentials stay server-side.

## Collection
- Proximity discovery may identify an eligible drop when the user is within the configured radius.
- Wallet transactions are never signed silently. A proximity hit creates a claim intent and the user must explicitly confirm the wallet transaction.
- Location permission is requested only when the proximity feature is enabled.
- The claim layer is intentionally separate from the NFT contract adapter so it can support free claims, sponsored claims, or paid gas flows without changing discovery UX.

## Product integrity
- Sponsored content must remain disclosed.
- Revenue calculations are accounting helpers, not payment execution.
- Real GLB/GLTF assets remain preferred over procedural fallbacks.

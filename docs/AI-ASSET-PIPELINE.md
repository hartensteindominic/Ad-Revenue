# Voxel Vault AI Asset Pipeline

The AI layer is an assistant, not the minting authority.

1. Collectible metadata provides a deterministic seed, family, rarity and traits.
2. `createVisualDNA()` converts those inputs into reproducible visual parameters.
3. The asset director packages the DNA and optional creative prompt for a generation service.
4. Generated results are normalized into a GLB/GLTF asset manifest.
5. A human or creator workflow reviews the result before minting.
6. Sponsored assets retain explicit sponsorship metadata and disclosure.
7. The renderer uses the real model first and falls back only when necessary.

The generation service itself should remain provider-agnostic. No API key belongs in client code.

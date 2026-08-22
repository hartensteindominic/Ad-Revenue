# Real-product 3D asset contract

A catalog item may provide `modelUri` with a licensed GLB/GLTF that depicts the matching physical product. `Product3DTwin` should load that asset when present. When `modelUri` is absent, the viewer must use the product-specific Voxel Vault procedural twin and visibly show the real supplier product reference image. Do not label a procedural twin as an exact manufacturer model.

# Voxel Vault production integration

## Product rules

1. Preserve the existing futuristic Voxel Vault visual shell.
2. The 3D collectible is the visual focal point on mobile and desktop.
3. Technical engine diagnostics stay behind the scenes unless a user asks to inspect them.
4. Never display an NFT as owned unless ownership is verified from the connected wallet or chain data.
5. Demo marketplace states must be explicitly labeled DEMO.
6. Card/USD checkout and ETH checkout are separate, honest flows.
7. Failed GLB loads fall back to a lightweight procedural preview instead of a blank viewer.

## Hardening pack integration order

### A. Foundation
- Remove static export configuration only if the production target is Vercel/Node.
- Keep `app/page.js` pointed at the current Voxel Vault experience rather than replacing it with an older homepage composition.
- Add security headers and API rate limiting after confirming the application's existing middleware/API conventions.

### B. 3D
- Keep `Safe3DViewer` and `Fast3DStage` as the rendering boundary.
- Lazy-load Three.js and load only visible gallery assets.
- Render an immediate lightweight preview, then replace it with the real GLB/GLTF.
- Never block the whole page on one asset.

### C. Ownership
- Imported NFTs require contract + token ID.
- Resolve tokenURI and metadata safely.
- Call `ownerOf` when supported.
- Show `Verified by your wallet`, `View only`, or `Unable to verify` explicitly.

### D. Vault Spots
- A spot may reference a collectible only after verification.
- Store the reference separately from authoritative on-chain ownership.
- Location permissions are opt-in and should never be implied by a saved spot.

### E. Marketplace
- Read listings from the deployed contract in live mode.
- Estimate gas before writes.
- Re-check listing price immediately before purchase.
- Show pending, submitted, confirmed, and failed states.
- Never mark ownership changed before confirmation.

### F. Payments
- ETH checkout uses wallet transactions.
- USD checkout uses the configured payment provider and a server-side verified webhook/order state.
- A card payment must not be represented as an on-chain transfer until the actual fulfillment flow has completed.

## Do not overwrite blindly

The supplied hardening pack contains useful foundation files, but older `page.js`, `VaultHero.js`, and `CollectionGrid.js` variants must not overwrite the current visual shell. Merge their security/runtime ideas into the current implementation instead.

## Release gate

Before production:
- `npm run build` passes.
- Type/lint checks pass where configured.
- All API routes are reachable on the intended host.
- Wallet connection is tested on desktop and iPhone.
- At least one real GLB and one fallback preview are tested.
- Marketplace demo/live states are visually distinct.
- No placeholder ownership claims remain.
- Contract addresses and public site URL are configured in Vercel.
- DNS and both apex/www domains resolve.

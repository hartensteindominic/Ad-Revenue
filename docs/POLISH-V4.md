# Voxel Vault Polish V4

This pass preserves the existing dark/purple visual identity and the bounded endless-gallery effect while tightening the seams that matter for scale and App Store preparation.

## Non-negotiables preserved

- Existing visual shell and color language.
- The seemingly endless deterministic NFT gallery.
- Bounded DOM growth while scrolling.
- 3D-first presentation.
- Wallet/blockchain ownership as the authority.

## V4 priorities

1. Keep production mutations fail-closed unless their required authorization/persistence is configured.
2. Make finite drop reservations recoverable instead of permanently consuming supply when a user abandons a claim.
3. Keep the iPhone build app-like without turning it into a thin website wrapper.
4. Keep direct crypto purchasing out of the first native iOS surface until the exact Apple payment/crypto path is implemented and reviewed.
5. Keep the web experience as the full collector/marketplace surface while the native layer focuses on discovery, scanning, inspection, and owned-collection viewing.
6. Do not spend the current $300 on mainnet deployment before the end-to-end loop is verified.

## Review gate

A production deployment is not considered green until:

- `npm run build` passes.
- `npm run chain:compile` passes.
- `npx hardhat test` passes.
- Supabase migrations are applied and claim reservation is atomic.
- Abandoned claim reservations expire and return capacity.
- Claim settlement is independently verified against the NFT contract and expected wallet.
- Drop creation is authorized in production.
- Marketplace settlement verification remains server-side and semantic.
- The iOS build has native value: QR scanning, haptics, deep links, local cache, and a real App Store/TestFlight build.

## Capital rule

For the $300 currently available, spend only on concrete blockers. Keep a reserve. The later $1,000 should remain staged and should be unlocked by measurable checkpoints rather than by calendar date.

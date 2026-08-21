# Voxel Vault Master-Code Guardrails

## Source of truth

`main` is the protected production/master branch. Feature work must happen on dedicated branches and reach `main` only through an explicit reviewed merge.

## Never overwrite blindly

Before changing an existing file:
1. Fetch the current file from the target branch.
2. Confirm the returned blob SHA is current.
3. Make the smallest targeted change possible.
4. If the SHA changes before the write, stop and refetch instead of forcing the update.

Never force-push `main`. Never replace the homepage visual shell with a generated replacement unless explicitly approved.

## Visual invariants

- Keep the simple, fun Voxel Vault visual language.
- Keep the primary 3D object centered in its stage.
- Keep 2D fallbacks centered with `object-contain`.
- Keep small decorative stars subtle, not streak-like or cheesy.
- Preserve wallet, marketplace, discovery, and hunt entry points.

## Upgrade order

1. Canonical NFT media integration and regression testing.
2. Fast 2D/3D loading, centering, and fallback hardening.
3. Live AI asset pipeline verification.
4. Vault Rewards Engine with USD accounting and auditable campaign allocations.
5. Vault Hunt / discovery economy.
6. Sponsored campaigns with clear disclosure and configurable revenue splits.
7. Final security, contract, mobile, and production regression pass.

## Financial integrity

Never display a reward as earned, claimable, or paid unless the backend can substantiate it. Use integer minor units for USD accounting. Campaign splits must be configurable and auditable. Sponsored content must remain appropriately disclosed.

## Change discipline

Prefer additive components and adapters over replacing stable UI. Keep the current visual shell intact unless the user explicitly approves a redesign. When a change touches a shared component, test all known surfaces before moving to the next yellow item.

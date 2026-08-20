# Voxel Vault Review + Build Plan

## Goal

Harden Voxel Vault without flattening its 3D identity. Build the product as one connected loop:

**discover → reveal → authorize → verify → own → collect/trade → discover again**

Sponsored collectibles are an economic layer inside that loop, not a replacement for the collectible fantasy.

## Five review layers

1. **Engineering**
   - Build must pass.
   - Server boundaries must be explicit.
   - Client input is untrusted.
   - On-chain state is authoritative for ownership.
   - Async flows need cancellation, idempotency, and clear failure states.

2. **Product**
   - The primary identity remains 3D collectible discovery.
   - Marketplace, hunts, physical discovery, creator tools, and sponsorship must reinforce the same loop.
   - Sponsored content must be useful or collectible on its own.

3. **Trust**
   - Never represent a client-supplied transaction hash as proof of ownership.
   - Never fabricate activity, users, volume, inventory, or campaign performance.
   - Clearly label demo/testnet/sponsored states.
   - Sponsorship must be disclosed in UI and metadata.

4. **Presentation**
   - Preserve the existing dark, premium Voxel Vault visual language.
   - Prioritize loading, error, empty, wallet, and transaction states before decorative polish.
   - Respect reduced motion and mobile constraints.

5. **Integration / seams**
   - Bluetooth is discovery only.
   - QR remains the cross-platform discovery path.
   - NFC is optional enhancement where supported.
   - Discovery never grants ownership by itself.
   - A discovered item enters the same wallet → transaction → verification pipeline as every other collectible.

## Sponsored collectible architecture

A sponsored collectible is a real collectible whose campaign economics are sponsored by a disclosed partner.

- The **object is the ad medium**.
- The sponsor does not receive hidden ownership powers.
- Sponsorship cannot mint ownership without the normal authorization path.
- Sponsor identity, campaign ID, disclosure, creator, and destination are metadata fields.
- A collectible may be sponsored, creator-funded, community-funded, hunt-earned, or Vault-native.
- Do not make every object sponsored. Preserve editorial and creator-native supply.
- Do not invent campaign performance numbers. Analytics must come from measured events later.

## Build order

### Phase A: foundation
- Add a typed-by-convention sponsorship registry and validation helpers.
- Add a reusable sponsored collectible presentation surface.
- Add campaign disclosure and provenance language.
- Add a sponsor-facing route that explains the product without pretending campaigns already exist.

### Phase B: seam hardening
- Verify transaction receipts server-side before ownership is recognized.
- Add idempotency and replay protection to discovery/claim flows.
- Keep BLE discovery separate from authorization.
- Provide QR fallback and explicit browser capability messaging.

### Phase C: economic loop
- Add sponsor campaign intake and approval workflow.
- Connect approved campaigns to measurable collectible impressions, reveals, claims, and redemptions.
- Add creator/sponsor revenue accounting only after the underlying events are trustworthy.

### Phase D: adversarial integration
- Test replayed transaction hashes.
- Test forged discovery payloads.
- Test wrong-chain transactions.
- Test duplicate claims.
- Test malformed sponsor metadata and redirect URLs.
- Test wallet cancellation and stale UI state.

### Phase E: release
- Build.
- Run smoke and integration checks.
- Inspect the diff and branch status.
- Open a draft PR.
- Only merge/deploy after the branch is verified.

## Non-goals for this branch

- No fake sponsor campaigns.
- No fabricated ad metrics.
- No hidden advertising.
- No mainnet claims.
- No replacement of the existing visual shell.
- No Bluetooth-only critical path.

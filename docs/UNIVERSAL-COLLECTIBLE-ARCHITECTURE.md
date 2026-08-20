# Voxel Vault Universal Collectible Architecture

## Vision
Voxel Vault is designed around a portable 3D collectible identity, not a marketplace-only NFT page.

A collectible should have one canonical identity that can be inspected, owned, transferred, traded, displayed, and adapted to compatible platforms without losing provenance.

## Collectible identity
Each asset should eventually have:

- immutable collection + token identity
- canonical metadata URI
- canonical GLB/GLTF asset URI where licensing permits
- creator + royalty configuration
- traits, rarity, material, reality basis, edition and version
- supported-platform profiles
- wallet ownership state
- listing / offer / auction state
- provenance and transaction history

## Universal interaction model

### Show
A collector opens an asset and sees the same collectible identity whether browsing on desktop or mobile.

### Inspect
One active 3D viewer at a time. Mobile uses zero WebGL until the collector explicitly opens 3D inspection.

### Own
Wallet connection displays the connected address and on-chain ownership when contracts are configured.

### Transfer
A future Transfer flow must require explicit recipient confirmation, display network + estimated fee, simulate where possible, and link to the explorer after confirmation.

### Trade
Offers, listings and auctions are separate state machines. Never represent a catalog price as an on-chain listing price.

### Tap-to-transfer
A future mobile handoff can use a QR/deep-link session. NFC may be used as a transport for a signed handoff payload, but never as a secret-key transport. The receiving wallet must confirm the exact token, chain, recipient and transaction before signing.

## Platform portability

Voxel Vault should expose adapters instead of pretending that every platform shares the same NFT standard.

Example profile shape:

```json
{
  "platform": "sandbox",
  "assetUri": "ipfs://...",
  "metadataUri": "ipfs://...",
  "status": "draft",
  "requirements": [],
  "externalId": null
}
```

A Sandbox profile is only marked `published` after an actual platform-side publication/verification step succeeds.

## Security rules

- Never request or store a user's private key.
- Never silently transfer an NFT.
- Never infer ownership from localStorage.
- Never trust client-side catalog prices for payment transactions.
- Always show chain and destination before a signing action.
- Keep testnet and production configuration explicit.
- Treat external platform synchronization as an integration with its own authentication and validation.

## Roadmap

1. Canonical collectible model
2. Creator Studio + GLB/GLTF validation
3. Wallet-owned My Assets
4. Transfer flow
5. Offer/trade flow
6. QR/deep-link mobile handoff
7. Platform adapter framework
8. Verified Sandbox publishing adapter
9. AI Curator + AI Creator
10. Automated marketing/share cards

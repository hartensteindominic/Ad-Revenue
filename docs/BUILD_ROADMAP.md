# Voxel Vault Build Roadmap

## Branch strategy

- `main`: production-safe only.
- `develop`: integration branch.
- `feature/*`: isolated product work.
- `security/*`: security hardening and audit preparation.
- `qa/*`: end-to-end verification.

## Golden path

Create 3D asset → metadata → preview → mint on Sepolia → wallet ownership → Vault → Drop → Discover → Claim → Trade → Transfer → new owner.

## Build order

1. Core stability
2. 3D engine
3. NFT lifecycle
4. Creator Studio
5. Hunt Engine
6. Proximity layer (QR/NFC/BLE/deep links)
7. Trading
8. Marketplace
9. Drop Economy
10. AI Curator
11. Real-world/AR layer
12. Security audit
13. Mainnet

## Proximity rule

Bluetooth, NFC and QR are discovery/interaction transports. Blockchain transactions remain the source of truth for ownership. No proximity signal may be treated as proof of NFT ownership.

## Release gates

- Build passes.
- Contract compile/tests pass.
- API authorization and race-condition tests pass.
- 3D viewer has graceful WebGL failure handling.
- Wallet transaction states distinguish pending, confirmed and rejected.
- No private keys or secrets are committed.
- Sepolia end-to-end golden path succeeds before mainnet work.
- Independent contract audit precedes real-value mainnet deployment.

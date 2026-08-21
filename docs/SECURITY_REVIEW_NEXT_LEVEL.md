# Next-Level Security Review

## Release status

**Preview only. Do not merge or deploy to production from this branch.**

## Findings and controls

### NFT mint authority
The current `VoxelVaultNFT` contract exposes a configurable public mint path and the repository documents disabling public mint before mainnet. Treat that setting as a production release gate. A future protocol mint service should use a dedicated minter role and explicit claim authority.

### Spatial claims
GPS is a proximity signal only. A client-created claim intent must be verified by a server or trusted attestation layer before any on-chain action. Never treat latitude/longitude alone as proof of ownership or identity.

### Indoor anchors
Room IDs and local 3D positions can reveal sensitive information. Keep private room anchors local-first, minimize precision when sharing, and require explicit user action before publishing an anchor.

### Access grants
Grants are revocable and optionally expiring. The grant layer is an authorization model, not a blockchain capability token until a future signed/attested representation is designed.

### Cross-chain
No custody, lock, mint or wrapped asset flow is implemented here. Production bridging requires an audited bridge/messaging protocol plus replay protection, source finality, destination verification and emergency pause/recovery.

### AI
AI output is advisory. It must not silently alter ownership, rarity, royalties or payment state. Server-side secrets stay server-side.

### Quantum
The research layer is explicitly simulation-only. No claim of quantum hardware, quantum-secure cryptography or quantum currency is made.

### Background activity
Reactor/idle progression remains gameplay state. No browser cryptocurrency mining, wallet signing or hidden transaction execution is allowed.

## Release blockers before production

1. Verify all contract addresses and network IDs.
2. Disable public mint where appropriate for the production contract.
3. Add authenticated server-side verification for spatial claims.
4. Add rate limiting and replay protection to claim endpoints.
5. Complete dependency/security audit.
6. Complete mobile WebGL and visual QA on the new protocol route.
7. Verify production SHA after merge.

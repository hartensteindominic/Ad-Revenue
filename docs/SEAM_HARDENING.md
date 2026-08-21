# Seam Hardening

This document defines the security boundary for Voxel Vault's physical-to-chain loop.

## Authority order

1. QR, Bluetooth, NFC, GPS and deep links are discovery transports.
2. Server authorization creates a short-lived claim intent/reservation.
3. The wallet signature authorizes the blockchain transaction.
4. The chain receipt and expected contract/event are authoritative for ownership.
5. The UI must never convert discovery or server authorization directly into ownership.

## Cross-platform physical discovery

QR/deep links are the universal path. Bluetooth and NFC are capability enhancements and must be feature-detected. Unsupported browsers must retain a complete QR/deep-link flow.

## Adversarial cases

- replayed proximity nonce
- expired proximity intent
- malformed or oversized drop identifiers
- forged wallet address strings
- claim replay for the same wallet/drop
- duplicate concurrent claims
- client-supplied distance treated as authoritative
- successful transaction receipt for the wrong contract/action
- UI ownership state updated before chain confirmation

## Product boundary

The 3D collectible remains the product. Physical discovery, wallet ownership, marketplace settlement and AI curation exist to strengthen the discovery-to-ownership loop rather than become separate products.

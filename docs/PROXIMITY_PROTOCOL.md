# Voxel Vault Proximity Protocol

Voxel Vault supports multiple ways to initiate a nearby interaction:

- QR/deep links: universal fallback.
- NFC: tap-oriented discovery where the device/browser supports it.
- Bluetooth Low Energy: proximity discovery through a compatible native/device layer.

## Security boundary

A proximity event is never proof of ownership. It can identify or initiate an interaction, but NFT ownership changes only after the appropriate wallet-signed blockchain transaction is confirmed.

## Trade flow

1. User A selects an NFT and creates a trade intent.
2. Proximity transport exchanges a short-lived session identifier.
3. User B reviews the asset and trade terms.
4. Both wallets explicitly approve the transaction(s).
5. The application waits for the blockchain receipt.
6. Ownership is refreshed from chain state.

Never treat a Bluetooth message, QR payload, GPS coordinate, or client-side flag as confirmation of ownership.

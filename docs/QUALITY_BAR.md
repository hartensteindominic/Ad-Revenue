# Voxel Vault Quality Bar

This is a decision filter for future Voxel Vault work. It is intentionally broader than a code checklist.

## 1. Engineering

- Production builds pass.
- Contracts compile and have adversarial tests for every value-moving path.
- APIs authenticate and authorize mutations.
- Server state cannot be replaced by client assertions.
- Blockchain ownership is read from chain state.
- Transaction states distinguish signing, submitted, confirmed, reverted, and rejected.
- 3D/WebGL resources are lazy-loaded, disposed, and resilient to failure.
- No secrets are committed or exposed to the browser.

## 2. Product

Voxel Vault should remain one coherent product: interactive 3D collectibles discovered, owned, and exchanged in the physical/digital world.

The six major layers are:

- 3D collectible experience
- discovery/hunts
- blockchain ownership
- physical interaction (QR/NFC/BLE)
- marketplace/trading
- AI curation/creation assistance

New features must strengthen the core loop rather than merely add another destination or dashboard.

## 3. Trust

- Sepolia, test/demo, and mainnet states are unmistakably different.
- A claim ticket is authorization, never ownership.
- A tx hash is evidence only after independent chain verification.
- Proximity, GPS, QR, and Bluetooth signals are interaction inputs, never ownership proof.
- Real-value deployment requires independent contract audit and controlled owner/treasury keys.
- User-facing copy must never imply a transaction succeeded before receipt confirmation.

## 4. Presentation

- Preserve the existing premium visual identity unless a change is necessary.
- Optimize for discovery, not generic "futuristic" decoration.
- Loading, empty, rejection, failure, and success states are first-class screens.
- Mobile is a primary surface, not a shrunken desktop.
- The 3D object remains visually dominant where appropriate.

## 5. Integration seams

The most important tests are transitions between systems:

1. physical discovery -> collectible reveal
2. collectible reveal -> claim intent
3. claim intent -> wallet signature
4. signature -> confirmed ownership
5. ownership -> Vault display
6. Vault -> trade intent
7. trade intent -> authorized wallet transaction
8. marketplace -> hunt/discovery motivation
9. AI recommendation -> user-controlled action
10. creator -> drop -> collector -> secondary market -> creator royalty

A feature is not complete because its individual screen works. The handoff into the next system must also be truthful, understandable, recoverable, and useful.

## Review rule

Every review should attempt a different failure mode. Repeating the same checklist 100 times is not 100 reviews. We count adversarial coverage, not repetition.

## Current hard blockers

- Server-side claim settlement must become genuinely enforceable on-chain, not merely ticket-based.
- Claim quantity reservation must be atomic and recoverable after failed/unsubmitted minting.
- Trade confirmation must independently verify the transaction receipt and expected state change.
- Drop creation mutations need creator authorization and abuse/rate controls.
- QR generation must use a real standards-compliant QR encoder.
- Wallet connection should consistently use the shared provider abstraction rather than ad-hoc `window.ethereum` calls.
- CI/build must be green before integration into `main`.
- Mainnet remains blocked until contract audit and controlled deployment are complete.

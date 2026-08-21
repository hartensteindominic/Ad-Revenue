# Voxel Vault App Store Readiness V5

This document is a release plan, not an Apple approval claim.

## Current Apple constraints to design around

Apple's current App Review Guidelines allow apps to let users view NFTs, and they permit NFT-related services such as minting, listing, and transferring under the applicable in-app-purchase rules. Cryptocurrency wallets have additional requirements, including organization enrollment for wallet apps. The exact treatment depends on the feature and storefront, so the release build must be reviewed against the current guidelines before submission.

Voxel Vault therefore should not depend on a theory that a web checkout or Safari handoff automatically avoids App Store payment requirements.

## V1 native product

The first iPhone app should be a real companion product with native value:

- Discover the forever gallery quickly.
- Inspect selected objects in interactive 3D.
- Scan physical Voxel QR codes.
- Use haptics for discovery, successful scans, and claim states.
- Open a specific Voxel or hunt through deep links.
- Cache recently viewed objects and non-sensitive presentation data locally.
- Use the native share sheet.
- Show optional location use only when a hunt requires it.
- Include a deterministic demo mode so App Review can exercise the experience without private credentials or unpredictable physical hardware.

## Web product

The web app remains the full creator/marketplace surface until the native payment and crypto UX has been explicitly reviewed.

## Native implementation gates

1. Capacitor shell loads the stable production app.
2. QR scanner works on a physical iPhone.
3. Deep links route to a specific Voxel/hunt.
4. Haptics work and degrade gracefully.
5. Native share sheet works.
6. Local cache survives app relaunch and never becomes the authority for ownership.
7. 3D rendering remains bounded and battery-conscious.
8. Privacy/support URLs are live.
9. App icon asset catalog is generated from the approved Voxel Vault mark.
10. TestFlight build passes on real iPhone hardware.
11. App Review notes include a complete demo path and sample QR code if needed.

## Do not submit yet if

- the app is effectively only a web wrapper;
- wallet/claim behavior is inconsistent;
- NFT ownership is represented from local state;
- the claim signer or Supabase persistence is missing for a production claim flow;
- there are placeholder URLs or incomplete support/privacy pages;
- the app crashes or drains battery during 3D browsing;
- the business/payment model cannot be explained clearly in App Review notes.

# Review Notes V4

## What was rechecked

### Gallery and performance

The main Vault feed uses deterministic catalog generation and a rolling card window. New pages are appended and the rendered list is trimmed to 24 cards, so the page can feel endless without growing the DOM forever. This behavior is intentionally preserved.

### 3D rendering

The gallery uses lightweight previews for most cards and reserves interactive 3D for inspection. This is the right direction for iPhone and mass traffic. Full GLB/GLTF delivery should remain lazy and CDN/object-storage backed as creator assets become real.

### Ownership and money

The NFT contract uses OpenZeppelin 5-compatible inheritance and caps royalties at 15%. Public mint is disabled by default in the hardened branch. Marketplace payouts use pull withdrawals and reentrancy protection.

The server-side trade path verifies the expected chain, settlement contract and semantic marketplace event before application state becomes confirmed.

### Remaining blockers

- Claim authorization still needs a dedicated on-chain claim-settlement path that binds the server-issued claim to the minted token.
- Production drop creation is now protected by an admin secret boundary, but a proper authenticated creator/admin identity should replace that shared secret before public creator tools launch.
- Claim reservations now have an expiry migration, but the migration must be applied and exercised against the real Supabase project.
- The first iOS shell now has Capacitor configuration and native haptic integration, but QR scanning, local cache, native share and deep-link routing still need to be implemented and tested on a physical iPhone.
- A real Apple app icon asset catalog must be generated from the approved mark before submission; the repository SVG is the source artwork, not the final App Store asset set.
- The Vercel Hobby deployment quota is currently blocking additional deployment attempts; do not burn repeated deploy attempts until the quota resets or the team intentionally moves to Pro.

## Design rule

Do not replace the visual identity. Improve the object quality, motion restraint, accessibility, failure states and performance underneath the existing shell.

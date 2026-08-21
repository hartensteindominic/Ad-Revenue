# Voxel Vault Polish V5

## What this pass protects

The premium dark/purple visual language and the bounded forever-gallery are product assets. They are not being redesigned.

The gallery should feel effectively endless while rendering only a small rolling window. Heavy 3D inspection remains on-demand so iPhone and lower-power devices are not forced to render a warehouse of WebGL objects.

## The most important architectural upgrade

A server-issued claim ticket is now intended to become a real on-chain authorization boundary.

Flow:

1. The server reserves finite drop capacity atomically in Supabase.
2. The server creates a short-lived claim voucher bound to the recipient wallet, drop, claim ticket, exact metadata URI, royalty receiver, nonce, and deadline.
3. The voucher is signed with EIP-712 by a dedicated claim signer.
4. The NFT contract verifies the signature with OpenZeppelin's `SignatureChecker`.
5. The contract marks the claim ticket as consumed before minting.
6. The collector pays network gas and receives the NFT only after chain confirmation.

This closes the old gap where a client could possess a valid-looking claim ticket while the NFT contract still accepted an unrelated public mint.

## Release rule

Do not enable public mint on a production NFT deployment. Creator/admin minting and sponsored claims must use explicit authorized paths.

The claim signer must be a dedicated key or approved smart-contract wallet. Never use a private key in source control. If a Safe is used as the signer, ERC-1271 verification should be exercised on the target network before mainnet.

## iPhone strategy

The native app should earn its place in the App Store by being a discovery and collection companion rather than a thin wrapper.

Native-value targets:

- fast forever-gallery browsing
- lightweight 3D inspection
- QR scanning for physical Voxel drops
- haptic feedback for discovery and claim states
- deep links into a specific Voxel or hunt
- local cache for the last viewed/owned objects
- native share sheet
- clear privacy controls for optional location use
- a reviewer-safe demo mode with sample drops

Crypto purchasing and wallet behavior must be reviewed against Apple's current App Review Guidelines before enabling any purchase flow in the native surface. Do not design around an assumption that opening Safari automatically bypasses Apple's payment rules.

## $300 capital rule

The $300 should buy product capability, not vanity infrastructure.

### Release 0: $0

Finish the claim voucher path, CI, testnet validation, App Store architecture, and physical-device checklist before spending.

### Release 1: $99

Apple Developer Program membership, only when the native build is sufficiently complete to justify TestFlight work.

### Release 2: $25-$40

A small physical hunt kit: QR/NFC-compatible tags, weatherproof holders, or inexpensive signage for a real-world pilot. This converts Voxel Vault from a screen-only concept into a testable physical discovery product.

### Release 3: $40-$60

A tiny set of high-quality original 3D assets or creator bounties for the first pilot collection. Favor assets that demonstrate different categories and are licensed for commercial use.

### Release 4: $0-$30

Testnet/L2 gas and operational tooling only when a complete vertical slice is ready to exercise.

### Reserve: at least $70-$130

Do not spend this until real users expose a specific bottleneck.

## What is deliberately NOT funded yet

- Ethereum mainnet gas
- a large creator campaign
- paid ads
- Vercel Pro solely because repeated development deployments hit a daily quota
- large IPFS/CDN commitments before real asset traffic exists
- an independent audit before the contract interface is frozen

## Success metrics

The first business signal is not page views.

Measure:

- gallery session -> object inspection
- inspection -> wallet connection
- discovery -> claim reservation
- reservation -> confirmed on-chain ownership
- owned object -> return visit
- creator upload -> published collectible
- physical drop scan -> repeat visit

The goal is a loop that people voluntarily repeat: **discover -> inspect -> claim -> own -> return**.

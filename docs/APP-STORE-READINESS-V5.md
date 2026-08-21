# Voxel Vault iPhone / App Store Readiness V5

## Executive decision

Do not ship a generic web wrapper. Ship Voxel Vault as a native-enhanced 3D discovery companion that keeps the existing dark/purple visual identity and the bounded seemingly-endless gallery intact.

The iPhone build should make three things materially better than the website:

1. **Save discoveries locally** in My Vault for fast revisit.
2. **Share discoveries through the native iOS share sheet.**
3. **Use native haptics and safe-area behavior** around discovery and collection actions.

The next native layer should add QR/camera discovery and deep-link routing once the core build is green. AR should be a later feature only if it is a genuinely integrated experience, not a model-drop gimmick.

## Apple rules that matter right now

Apple's current App Review Guidelines say apps should elevate beyond a repackaged website under 4.2. The current Voxel Vault plan therefore treats native saved collection, sharing, haptics, deep links, and future camera/QR discovery as product functionality rather than cosmetic wrapper features.

For NFT payments, Apple's current 3.1.1 language permits NFT-related services through In-App Purchase and specifically states that the restriction on external purchase buttons/links does not apply to apps on the United States storefront. That is materially different from the older blanket statement that every iOS NFT mint must happen through IAP.

**V1 distribution recommendation:** launch the App Store binary on the United States storefront first. Keep the purchase architecture explicitly documented, make no claims about investment returns, and review every additional storefront separately before expanding internationally.

Do not assume this means approval is guaranteed. Apple still reviews the complete payment flow, metadata, privacy behavior, crypto functionality, and minimum-functionality experience.

## Current technical gates

### Gate 1: Web and contract health

- `npm run build` passes.
- `npm run test:universal` passes.
- Proximity and adversarial tests pass.
- Hardhat compile passes.
- Marketplace tests pass.
- No deployment is treated as green solely because a previous Vercel preview was green.

### Gate 2: Claim authority

A server-issued claim ticket is not itself ownership.

The V5 flow is:

1. Server authorizes a wallet for a finite drop.
2. Supabase atomically reserves capacity and creates a 10-minute reservation.
3. Wallet submits the NFT mint transaction.
4. Server verifies the transaction receipt, expected NFT contract, transaction sender, `VoxelMinted` event, token ID, and claim ticket embedded in the metadata URI.
5. Supabase atomically changes the reservation to `confirmed`.
6. UI may call the claim complete only after chain confirmation plus server settlement verification.

This prevents application state from drifting away from on-chain ownership.

### Gate 3: iPhone value

The native shell provides:

- Haptic feedback.
- Local My Vault storage using Capacitor Preferences.
- Native share sheet using Capacitor Share.
- Native browser handoff using Capacitor Browser.
- iOS safe-area and touch-target handling.
- Reduced-motion behavior.
- Existing 3D GPU safety and bounded gallery behavior.

Next:

- QR/camera discovery.
- Universal/deep links to collectible inspection.
- Offline/reconnect polish.
- Physical iPhone WebGL testing.
- TestFlight review.

## Vercel reality

The current repository has reached Vercel's Hobby deployment rate limit. The GitHub status for the current main commit is therefore not a trustworthy code-health signal. Do not burn deployment attempts while the quota is exhausted.

Vercel Pro is currently $20/month and includes $20 of monthly usage credit. It can be justified later because it removes the current Hobby deployment bottleneck and gives the project a production-grade deployment path. It should not be purchased merely to make a failed build look green.

## The $300 investment plan

**Spend only when the gate it unlocks is ready.**

| Amount | Spend | Why it adds product value | Release condition |
|---:|---|---|---|
| $99 | Apple Developer Program | Unlocks TestFlight, App Store distribution, Xcode Cloud, advanced capabilities | Native build is ready and can be tested |
| $20 | Vercel Pro, one month | Removes the current Hobby deployment bottleneck and gives $20 included usage credit | Local/CI build is already green |
| $25 | Supabase Pro, one month | Durable claims, daily backups, longer logs, production database headroom | Migration 004 + 005 are applied and tested |
| $30 | Testnet/L2 gas + controlled experiments | Lets real users complete the full claim/marketplace loop | Contract deployment is verified on testnet |
| $50 | Creator/asset pilot | Adds real high-quality 3D inventory rather than synthetic filler | Golden path is stable |
| $76 | Reserve | Keeps the project able to absorb a rejection, asset, gas, or tooling problem | Never pre-spend |
| **$300** | | | |

### Why this is better than spending $300 on gas

The scarce resource right now is not ETH. It is **verified product value**.

Money should buy one of four things:

- distribution,
- reliability,
- better content,
- or measurable learning.

Do not buy mainnet inventory, speculative tokens, a large ad campaign, or an expensive security review before the product loop is demonstrably working.

## Apple build infrastructure

Apple currently requires App Store uploads to be built with Xcode 26 or later using the iOS 26 SDK or later. Xcode Cloud is included with the Apple Developer Program at 25 compute hours per month and can build, test, and distribute to TestFlight/App Store.

That makes the Apple Developer membership the first meaningful paid unlock once the native project is ready.

## Monetization strategy

Voxel Vault should make money from activity around the collectible ecosystem, not from pretending the NFTs are investments.

Primary experiments:

1. Marketplace fee on successful secondary sales.
2. Creator publishing and promotion tools.
3. Sponsored scavenger drops with transparent sponsor placement.
4. High-quality creator asset pilots that increase discovery and marketplace liquidity.
5. Carefully placed contextual advertising on the web experience, not an ad-dominated iPhone app.

The iPhone app should feel like a premium collector tool. It should not open with an ad wall.

## What not to do

- Do not merge unverified contract changes into main.
- Do not call a claim complete before server settlement verification.
- Do not enable public mint on mainnet without a deliberate economic model.
- Do not put ownership-gated functionality behind NFT ownership in the iOS app.
- Do not make investment, profit, or guaranteed-value claims.
- Do not expand internationally until storefront-specific payment/link rules are reviewed.
- Do not replace the existing visual shell with a generic mobile template.
- Do not turn the 100,000-form gallery into 100,000 simultaneous DOM/WebGL objects.

## Definition of App Store ready

Voxel Vault is App Store ready when all of these are true:

- Web production build is green.
- Contract compile/tests are green.
- Claim settlement is bound to verified on-chain mint events.
- Supabase migrations are applied.
- Native saved Vault and sharing work on a physical iPhone.
- The app survives WebGL context failure and reconnect scenarios.
- Privacy and Support URLs are live and accurate.
- App Review has a deterministic demo path with all required backend services enabled.
- App Store metadata matches the shipped functionality.
- The release build uses Xcode 26+ / iOS 26+ SDK requirements.
- TestFlight has passed internal and external testing before final submission.

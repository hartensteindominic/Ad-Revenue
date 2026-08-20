# Voxel Vault iPhone / App Store Readiness V4

## Product strategy

The iPhone app should be a native-enhanced Voxel Vault companion, not a thin website wrapper. Preserve the existing dark/purple visual language and the seemingly endless NFT discovery feed, while adding native capabilities around it.

### Native value for V1

- QR/camera scanning for physical Voxel discovery.
- Haptic feedback for reveal, discovery, claim-submission and successful collection moments.
- Deep links from collectible URLs into the inspection experience.
- Local cache for recently viewed collectibles and hunt state.
- Native share sheet for collectible links.
- Optional location permissions only when a user explicitly starts a location-based hunt.
- Crash diagnostics and device testing before TestFlight.

## Crypto and NFT boundary

Apple's current App Review Guidelines allow apps to use In-App Purchase for NFT-related services such as minting, listing and transferring. They also allow users to view their own NFTs as long as NFT ownership does not unlock app functionality. Wallet functionality has additional restrictions, including an organization requirement for cryptocurrency wallet apps. cite-not-in-repo-source-placeholder

For the first submission, keep the native surface focused on discovery, 3D inspection, hunts, sharing and viewing owned collectibles. Keep the full web marketplace and experimental crypto flows behind the web product until the exact iOS payment/wallet design has been reviewed against the current Apple rules for each intended storefront.

Do not market the app as an investment product or promise casual income. The product is a collectible/discovery experience; any economic activity must be presented accurately and compliantly.

## Release gates

- Web production build passes.
- Contract compile and adversarial tests pass.
- Claim reservation is durable and recoverable.
- Claim settlement is independently verified against the expected contract, wallet and event.
- Marketplace settlement is independently verified server-side.
- Production drop creation is authenticated.
- No placeholder support contact remains at submission.
- Privacy Policy and Support URLs are live.
- App Store metadata accurately describes the app.
- Physical iPhone testing passes for scrolling, WebGL failure, camera permission, deep links, wallet handoff and offline/reconnect behavior.
- TestFlight review passes before App Store submission.

## $300 currently available

Do not spend all $300 on crypto or infrastructure.

1. **$0 first:** use the current branch to finish code hardening and test gates.
2. **Up to $99:** Apple Developer Program membership when the native build is ready to test and submit. Apple currently lists the membership at $99/year. cite-not-in-repo-source-placeholder
3. **Keep at least $100:** reserve for testnet gas, small service costs, or an unexpected release blocker.
4. **Remainder:** only unlock after the iPhone build runs on a physical device and the web golden path is green.

## Later $1,000

Release the later capital in checkpoints rather than spending it all at once:

- $150: testnet/L2 experiments and load testing.
- $200: durable database, monitoring and asset delivery.
- $200: creator/sponsor pilot.
- $250: independent contract/security review after contract scope freezes.
- $100: abuse/load testing and App Store release hardening.
- $100: operating reserve.

The reserve is deliberately boring. Boring money is useful money.

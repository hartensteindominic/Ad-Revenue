# Voxel Vault iPhone / App Store Readiness

## Current target

Voxel Vault should feel like a real iPhone product, not a website squeezed into a phone frame. The existing dark/violet visual language and the endless collectible discovery feed are intentional and should remain the core identity.

## Already prepared in this branch

- iOS-safe viewport with `viewport-fit=cover`.
- Safe-area spacing for the notch, Dynamic Island and home indicator.
- 44px-class touch targets for primary controls.
- Reduced-motion handling for accessibility.
- Mobile WebGL protection: passive gallery cards stay lightweight and full 3D is requested when the collector opens an object.
- Standalone web-app manifest and install metadata.
- App icon source asset.
- Public Privacy Policy route.
- Public Support route.

## Native iOS layer still required before App Store submission

A final iOS build should add native value around the web product rather than submit a thin website wrapper. The native layer should provide:

1. Haptics for discovery, claim and successful collection moments.
2. Native camera / QR scanning for physical Voxel hunts.
3. Native location permission only when a user explicitly starts a location-based hunt.
4. Local device storage for a fast personal Vault cache and offline hunt state.
5. Native share sheet for collectible links and creator drops.
6. Push notifications as an optional feature, never as a requirement for rewards or core access.
7. Deep links from collectible URLs into the native inspection screen.
8. Crash reporting and production diagnostics before release.
9. A native onboarding flow that explains wallet ownership, sponsorship and hunt safety.

## Crypto / commerce release gate

Do not enable real-money mainnet collection inside the iPhone build until the contracts, settlement verification and marketplace accounting have passed dedicated tests and review. The app can remain fully useful in demo/testnet mode while the production money path is hardened.

## Apple submission checklist

- [ ] Apple Developer Program membership active.
- [ ] Final app icon exported in Apple's required sizes from the approved Voxel Vault mark.
- [ ] App Store screenshots captured on current iPhone sizes.
- [ ] Privacy Policy URL added to App Store Connect.
- [ ] Support URL added to App Store Connect.
- [ ] App Privacy answers completed from the actual production data flows and third-party SDKs.
- [ ] Account deletion flow added if account creation is enabled.
- [ ] Demo mode / review credentials prepared so App Review can exercise the core experience.
- [ ] All links and backend services live during review.
- [ ] Native camera/location permission strings are specific and only requested when needed.
- [ ] iPhone build tested on physical devices.
- [ ] TestFlight beta completed before production submission.
- [ ] Final App Review Notes explain the hunt, wallet and ownership model clearly.

## Important

The $300 currently available should not be spent on speculative infrastructure or mainnet assets. The first money should remove concrete release blockers, then prove the complete user loop on testnet, then buy the minimum Apple/Vercel capacity needed for reliable testing and submission.

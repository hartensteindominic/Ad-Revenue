# ChatGPT V5 Handoff

Use this prompt with the repository files when requesting another engineering pass.

## Mission

You are the senior engineer taking over Voxel Vault. Review the actual repository, not an imagined architecture. Preserve the existing visual shell, dark/purple palette, cinematic 3D hero, bounded deterministic gallery, wallet UX, marketplace structure, and existing user-facing flows unless a change is required for correctness, security, performance, or App Store compliance.

Do not rewrite the product into a generic template.

## Highest-priority review order

1. Find every current build blocker and fix the first real error before adding unrelated features.
2. Review `VoxelVaultNFT.sol` and `VoxelVaultMarketplace.sol` for authorization, reentrancy, royalty, escrow, auction, refund, and denial-of-service issues.
3. Review the finite-drop claim flow from reservation through mint and server settlement.
4. Verify that ownership is never declared complete from client input alone.
5. Review Supabase migrations 002, 003, 004, and 005 for race conditions, expiry accounting, unique indexes, and transaction atomicity.
6. Review the iPhone layer for real native value rather than a thin website wrapper.
7. Review 3D rendering for iPhone GPU, memory, battery, and WebGL-context resilience.
8. Review App Store metadata and payment behavior against the current Apple rules for the intended storefronts.
9. Review monetization for actual product value instead of speculative crypto spending.
10. Only after all of the above, polish visuals and micro-interactions.

## V5 security invariant

A server-issued claim ticket is an authorization record, not proof of ownership.

A claim is complete only when:

- the expected chain is confirmed;
- the expected NFT contract is the transaction target;
- the transaction succeeded;
- the transaction sender is the authorized wallet;
- the `VoxelMinted` event exists;
- the emitted creator matches the wallet used by the claim;
- the token ID matches when supplied;
- the metadata URI contains the server-issued claim ticket; and
- Supabase atomically records the confirmed settlement.

If server verification is unavailable after a successful wallet transaction, report **on-chain ownership confirmed / server claim finalization pending**. Never call it a failed mint and never silently mark the claim complete.

## iPhone product direction

The native app should add real collector utility:

- local My Vault saved discoveries;
- native share sheet;
- haptic feedback;
- safe-area handling;
- native browser handoff where appropriate;
- deep links into collectible inspection;
- camera/QR discovery in a later pass;
- offline/reconnect resilience;
- eventually AR only if the AR experience is genuinely useful.

Keep the main visual language intact.

## $300 capital rule

Treat $300 as staged product capital, not gambling capital.

Recommended order:

- $0: engineering and test gates first;
- $99: Apple Developer Program when the iOS build is ready;
- $20: one month of Vercel Pro only when deployment capacity is the actual blocker;
- $25: one month of Supabase Pro only when durable production claims need it;
- $30: controlled testnet/L2 gas and experiments;
- $50: high-quality creator/asset pilot;
- $76: reserve.

Do not spend on mainnet speculation, bulk NFT inventory, ads, or expensive consulting until the golden path is green and measurable.

## Required output from each review

Return:

- exact blocker;
- why it is a blocker;
- smallest safe fix;
- files changed;
- tests added;
- what remains unverified;
- App Store risk level;
- monetization/value impact;
- whether the change should merge into main.

Be skeptical. If a previous review claims a bug that does not exist in the repository, say so. If a proposed fix creates a larger risk, reject it.

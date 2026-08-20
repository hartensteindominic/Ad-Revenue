# Sponsored Collectibles Review

## Review verdict

The original Kimi v2 implementation is useful as a prototype, but it is not legitimate enough for real-money production as written.

### Findings corrected on `feature/sponsored-collectibles`

1. **Client-side state was too authoritative.** Campaign reservations and confirmations in browser memory cannot be the source of truth for ownership or settlement.
2. **Money was not actually integer-only.** `parseFloat`, floating-point ratios, and division were still present despite the v2 claim.
3. **`txHash` was accepted without verification.** A transaction hash alone cannot prove a successful, correct settlement.
4. **Reward accounting could be wrong.** The frontend calculated revenue from campaign allocation instead of an authoritative confirmed payment.
5. **Analytics were spoofable.** Browser-supplied region/device values are telemetry, not financial proof.
6. **The Solidity reservation limit was keyed by campaign, not wallet.** The corrected contract tracks reservations per wallet per campaign.
7. **The Solidity reward amount was calculated but not transferred.** The corrected contract pays the collector reward and emits the actual reward amount.
8. **Campaign funding had accounting dust.** The corrected contract keeps the full funded balance and lets the sponsor recover only unallocated surplus after completion/expiry and cleared reservations.
9. **The original pause design did not pause ERC-721 transfers.** The corrected contract uses OpenZeppelin's `ERC721Pausable` extension.
10. **The product language risked disguising advertising.** The hardened design treats the advertisement as the collectible while requiring an explicit sponsored label/disclosure.

## Product model

The economic loop is now:

**Sponsor funds campaign -> Voxel Vault distributes genuinely collectible sponsored media -> collector owns the NFT -> collector may receive a campaign-funded reward -> creator/platform/reserve receive their configured shares -> unused campaign funds remain recoverable by the sponsor.**

This supports the bootstrap plan: initial platform funding can seed the ecosystem, while sponsor-funded collectibles become an additional revenue stream. The system should not claim self-sustainability until verified recurring revenue exceeds verified operating costs.

## Remaining gates

- Run the sponsored unit test in the repository environment.
- Run Hardhat compilation and contract tests against OpenZeppelin 5.4.
- Add invariant tests for split conservation, reservation replay, reservation expiry, failed payout rollback, campaign surplus, pause/unpause, and transfer behavior.
- Connect the sponsored mint to the existing server-side transaction verification seam.
- Run the full Next.js build and Vercel preview verification.
- Test the full Sepolia flow with a real wallet.
- Obtain an independent smart-contract review before mainnet funding.

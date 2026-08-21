# Voxel Vault Background Play + Legitimate Rewards Roadmap

## Product direction

Voxel Vault should remain useful when a collector is busy. The app can run a visible, battery-aware background progression loop that accumulates **Vault Energy** and unlocks verified missions. It must never pretend that a phone browser is mining cryptocurrency.

## Priority 0 — trust and safety

- No hidden CPU/GPU crypto mining.
- No wallet signing in the background.
- No secret transactions.
- No guaranteed financial return.
- Every on-chain reward must originate from a verified claim/event path.
- Energy is a gameplay resource, not cryptocurrency.
- Hard session and daily caps protect battery, abuse surface, and reward inflation.

## Priority 1 — Background Play

- Vault Reactor: visible idle progression while the user is away.
- Pause/bank controls.
- Daily cap and session cap.
- Local persistence with explicit status.
- Mobile-safe, no continuous render loop while backgrounded.

## Priority 2 — Verified Missions

- Spend Energy to queue scavenger, curation, discovery, and creator missions.
- Mission completion must be verified by the existing hunt/claim authority before any NFT or crypto reward is issued.
- Prevent duplicate completion IDs and replayed claims.

## Priority 3 — Real NFT progression

- Energy can unlock access, metadata packs, hunt tickets, cosmetic traits, and eligible drops.
- Authentic NFTs are minted or transferred only through the existing contract/payment paths.
- Reward receipts expose the source event and claim state.

## Priority 4 — Sustainable reinvestment

- Optional purchases can fund platform operations and sponsored drops.
- Clearly disclose sponsorship and revenue allocation.
- Never market Energy as a token or investment.

## Priority 5 — Advanced automation

- Notification reminders for completed background missions.
- Server-verified queued work.
- Rate limits and abuse scoring.
- Analytics for energy inflation, mission completion, and reward liability.
- Kill switch for reward issuance.

## Release gates

PLAN → REVIEW EVERYTHING → IMPLEMENT → UNIT TEST → BUILD → SECURITY REVIEW → VERCEL PREVIEW → BROWSER/VISUAL QA → FIX → RETEST → APPROVE PR → MERGE MAIN → VERCEL PRODUCTION → VERIFY LIVE SHA → PRODUCTION SMOKE TEST → MONITOR → ROLLBACK OR GREEN.

**Absolute rule: Green build never means finished.**

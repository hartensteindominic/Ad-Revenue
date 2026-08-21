# Voxel Vault Production Release Process

1. PLAN
2. REVIEW EVERYTHING
3. IMPLEMENT
4. UNIT TEST
5. BUILD
6. SECURITY REVIEW
7. VERCEL PREVIEW
8. BROWSER/VISUAL QA
9. FIX
10. RETEST
11. APPROVE PR
12. MERGE MAIN
13. VERCEL PRODUCTION
14. VERIFY LIVE SHA
15. PRODUCTION SMOKE TEST
16. MONITOR
17. ROLLBACK OR GREEN

## Absolute rule

**Green build never means finished.**

A release is green only after the intended commit is confirmed on production, the live browser renders the intended UI, critical user flows work, and no critical runtime errors remain.

## NFT media gate

For gallery changes, production QA must verify at least one real 3D render, one 2D asset, a broken asset fallback, mobile sizing, desktop sizing, centering, and inspection mode. Never infer UI correctness from build success alone.

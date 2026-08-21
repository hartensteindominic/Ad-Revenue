# Autonomous Deployment Loop

## Goal
Make feature work self-checking and deployment-friendly without allowing automation to bypass the protected production branch.

## Loop

1. Change only the feature branch.
2. GitHub Quality Gate runs reward tests, universal smoke tests, production build, and high-severity dependency audit.
3. Vercel creates a preview deployment from the feature branch.
4. Inspect the preview and runtime errors.
5. Fix failures on the same feature branch.
6. Repeat until the quality gate and preview are clean.
7. Only then mark the PR ready for human review/merge into `main`.

## Deployment lanes

- **PR preview:** visual and integration validation.
- **Feature preview:** rapid iteration and regression checks.
- **Production:** only after reviewed merge to `main`.

Unlimited deploy capacity should be used for validation, not for bypassing release controls.

## Non-negotiables

- Never force-push or directly rewrite `main`.
- Never expose secrets to browser code.
- Never treat a client callback as proof of payment or ownership.
- Never auto-sign a wallet transaction.
- Never mark rewards claimable before reconciliation.
- Never hide sponsored relationships from users.
- Never replace the established visual shell merely because a generated alternative looks newer.

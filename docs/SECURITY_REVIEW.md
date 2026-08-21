# Voxel Vault Security Review

## Release gate

Security review is a separate gate from build success. A production release is not green until the intended commit is verified on the live deployment and no critical runtime/security issue remains.

## Findings reviewed for this release

- **Wallet authority:** client proximity detection is treated as UX/eligibility input, not as permission to sign, mint, transfer, or grant ownership.
- **Rewards:** USD rewards require verified payment state before crediting; reward transitions are state-gated and regression-tested.
- **Sponsored campaigns:** sponsorship is explicitly disclosed; the allocation ledger is accounting-only until verified payment settlement reaches the existing reward infrastructure.
- **Checkout:** the client requests a server checkout URL and does not treat a client-side success flag as proof of payment. Sponsor checkout uses integer USD cents and Stripe idempotency keys.
- **Campaign inputs:** campaign IDs, budgets and featured NFT IDs are validated server-side; secrets remain server-only.
- **NFT media:** broken/unsupported media must degrade to a visible recovery state instead of silently producing an empty card.
- **WebGL:** passive gallery rendering is subject to the mobile/WebGL guard; full inspection remains an explicit user action.
- **AI authority:** World Director is advisory and cannot sign wallets, move funds, alter campaign budgets or bypass settlement.
- **Quantum authority:** World Optimizer is a deterministic research/simulation adapter and cannot execute financial actions or claim quantum hardware execution.
- **Privacy:** spatial anchors remain separate from ownership; exact private locations must not be written to public chain state.
- **CI mutation risk:** the previous mobile WebGL workflow could write directly to `main`. This is not an acceptable release pattern and is scheduled for replacement with a read-only verification workflow.

## Dependency audit note

The current dependency graph reports high-severity findings, including transitive development-tooling issues through Hardhat and vulnerabilities associated with the current Next/sharp/PostCSS chain. The available automated remediation includes breaking major-version upgrades.

For this release we do **not** silently run `npm audit fix --force`. Instead:

1. critical vulnerabilities remain a hard CI blocker;
2. high findings are documented here;
3. dependency-major upgrades receive their own branch and full regression cycle;
4. production dependencies are audited separately from development tooling.

## Release rule

**Green build never means finished.** The live deployment, rendered UI, critical flows, security state, and expected commit must all agree before release.

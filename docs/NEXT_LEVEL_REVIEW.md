# Next-Level Expansion Review

## Accepted into this release

- Protocol manifesto and architecture boundary.
- Deterministic NFT evolution preview engine with `predictEvolution()` semantics.
- Spatial anchors with latitude, longitude, optional altitude, indoor room IDs and local 3D coordinates.
- Explicit claim-intent generation. Proximity never equals ownership.
- Revocable Vault access grants: view, enter, collect, create, admin.
- Quantum research adapter with deterministic simulation and a strict non-quantum disclosure.
- Three.js Quantum Vault research gallery using the repository's existing Three.js 0.180 stack.
- AR hunt client route using device geolocation without automatic wallet signing.
- Cross-chain adapter boundary that produces preview-only routes until an audited provider is configured.
- Release tests for each new deterministic module.

## Deferred pending security/economic design

### VoxelVaultEvolution.sol
Do not deploy a new evolution contract yet. The existing NFT contract is authoritative. First define immutable state transitions, event indexing, upgrade policy, replay protection and gas bounds. The current evolution engine is read-only and deterministic so the UX can be built before introducing irreversible contract state.

### VoxelToken.sol / APY
Do not add a governance token or promise a fixed APY in this release. Token economics, staking, rewards, treasury controls and legal/compliance requirements need a separate design and security review. Gameplay Energy must remain distinct from cryptocurrency.

### Cross-chain teleportation
Do not ship a lock/mint bridge contract from an unaudited implementation. The adapter intentionally stops at a preview boundary. A production bridge requires audited messaging, source finality, destination verification, replay protection, pause controls and failure recovery.

### AI rarity oracle
Do not let an AI score silently rewrite on-chain rarity. AI can provide an explainable recommendation, but canonical rarity should remain deterministic or explicitly governed.

### NFC twins
NFC can provide a physical verification signal, but it is not proof of blockchain ownership. It should be modeled as a signed/attested physical-link record.

### Quantum computing
There is no quantum currency here. The research adapter is provider-neutral and simulation-only. A future real provider must be isolated behind the same job interface. Post-quantum cryptography should be evaluated independently from quantum-computing experiments.

## Release gate

PLAN → REVIEW → IMPLEMENT → UNIT TEST → BUILD → SECURITY REVIEW → VERCEL PREVIEW → VISUAL QA → FIX → RETEST → RELEASE REVIEW.

No deployment or main merge is implied by this branch.

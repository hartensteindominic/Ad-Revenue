# Voxel Vault Protocol Expansion

Voxel Vault remains a collector-first NFT experience while expanding toward a spatial ownership protocol.

## North star

**The world becomes the inventory.**

A Vault object may be anchored to a room, building, street, sky, hunt zone, or purely virtual space. Anchors are coordinates and rules, not ownership claims.

## Layers

1. **Vault** — canonical collectible metadata, ownership, provenance and marketplace state.
2. **Spatial** — indoor, outdoor and altitude-aware anchors with explicit precision and privacy rules.
3. **Discovery** — hunts, missions, Reactor progression and verified claim intents.
4. **Identity** — wallet-bound Vault identity, XP and progression.
5. **Access** — view, enter, collect, create and admin grants with expiry/revocation.
6. **Intelligence** — provider-agnostic AI planning, rarity analysis and asset quality gates.
7. **Settlement** — existing ETH and USD paths remain authoritative for actual payments and ownership.
8. **Research** — quantum-computing experiments and post-quantum security readiness, without pretending a quantum currency exists today.

## What is deliberately not implemented as a fake

- browser cryptocurrency mining
- hidden wallet signing
- automatic NFT transfers
- unaudited cross-chain bridges
- guaranteed APY
- invented quantum-security claims
- GPS presence being treated as blockchain ownership

## Evolution model

Collectibles can expose deterministic evolution previews from verifiable history. The engine is intentionally off-chain/read-only until an audited contract is designed around the exact state transitions.

## Cross-chain model

Cross-chain support is an adapter boundary. A future bridge must use an audited messaging/bridge provider, replay protection, finality checks, destination verification and explicit user confirmation. The UI may preview a teleport without claiming that a bridge exists.

## Spatial model

Anchors support:

- latitude / longitude
- optional altitude
- indoor room identifiers
- local 3D coordinates
- radius / bounding volume
- visibility and claim conditions
- privacy classification

Private room anchors are local-first by default.

## Quantum research model

The Quantum Vault module exposes a deterministic job contract so a real quantum provider can be attached later. The current implementation is a simulation/research harness, not a quantum computer and not a cryptocurrency.

## Release rule

**Green build never means finished.**

Every protocol feature must pass:

PLAN → REVIEW → IMPLEMENT → UNIT TEST → BUILD → SECURITY REVIEW → PREVIEW → VISUAL QA → FIX → RETEST → RELEASE REVIEW.

# Vault Identity · Next-Level Product Plan

Vault Identity is the human-facing identity layer for Voxel Vault. The wallet remains the ownership authority; Vault Identity is the evolving game/profile state built from verified activity.

## Core model

- Wallet: ownership and signing authority.
- Vault ID: deterministic human-readable identity derived from the wallet address.
- XP: progression only. It is not a cryptocurrency and has no cash value.
- Energy: gameplay resource for missions and Reactor progression. It is not proof-of-work mining.
- Discoveries: verified or explicitly user-recorded world discoveries.
- Missions: completed Voxel Vault jobs.
- Expeditions: Reactor/background activity sessions.
- Distance: verified movement data when the relevant verification layer is available.
- Rare/Mythic: collectible rarity history.

## Product loop

Move → discover → mission → expedition → verified result → XP/Energy → unlocks → collectibles → identity evolution.

## Trust rules

1. Never represent demo catalog records as minted NFTs.
2. Never call gameplay Energy cryptocurrency mining.
3. Never issue an on-chain reward without an explicit, auditable eligibility/claim path.
4. Vehicle/location signals are evidence, not automatically trusted truth.
5. Anti-spoofing and server-side verification belong in the reward authority layer.
6. Wallet connection must be explicit and must never auto-sign.
7. Identity progression must remain useful even without a connected wallet.

## Identity evolution

Level 1: New Vault

Level 5: Scout

Level 10: Explorer

Level 20: Roadrunner

Level 35: Curator

Level 50: World Scout

Level 75: Vault Architect

Level 100: Vault Founder

These titles are intentionally extensible. Future titles can be earned from behavior profiles rather than only XP thresholds.

## Future modules

- 3D personal Vault artifact generated from identity history.
- Vault Timeline with discoveries, missions, expeditions and collectible milestones.
- Voxel Atlas map with identity-aware recommendations.
- Contextual AI guide that summarizes useful nearby actions rather than producing walls of text.
- Verified drive/activity missions using privacy-preserving telemetry.
- Sponsor-funded drops with transparent economics.
- On-chain claim receipts tied to verified eligibility.
- Cross-device identity synchronization.

## Current release

This release adds the deterministic identity engine, local-first progression model, a dedicated `/identity` experience, and release-test coverage. It is deliberately safe to run without contracts or vehicle integrations.

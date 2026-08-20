# Voxel Vault Sponsored Collectibles Revenue Plan

## Product thesis

Voxel Vault does not need to revive the old NFT advertising model. It can make sponsorship useful by turning a brand placement into a collectible 3D object that people actually want to discover, inspect, keep, display, trade, or use.

**The NFT is the ownership layer. The 3D object is the product. Sponsorship is the funding layer.**

A sponsored collectible can be visually beautiful, playful, limited, location-aware, or part of a quest. The sponsor funds the campaign. Collectors receive the object and the experience. Creators can earn for making the object. Voxel Vault earns for operating the network.

## Critical trust rule

A sponsored object may be native to the collecting experience, but sponsorship must never be hidden.

Do not tell a user that a paid placement is an organic collectible when it is actually sponsored. That creates a trust and regulatory problem and would undermine the ownership story we are deliberately hardening.

Preferred UX:

- `Sponsored collectible`
- sponsor name
- campaign provenance
- collectible rarity / edition
- normal Voxel Vault ownership and provenance controls

The disclosure should feel like part of the object's provenance, not a giant banner that destroys the experience.

## Revenue loop

### Bootstrap phase

The operator funds the initial website, infrastructure and collector-reward reserve.

Bootstrap spending should prioritize:

1. hosting and RPC infrastructure
2. permanent 3D asset storage
3. drop infrastructure
4. creator production
5. collector rewards / sponsored-drop pool
6. analytics and abuse monitoring

The objective is not to subsidize users forever. It is to create the first functioning loop.

### Growth phase

Sponsors purchase campaigns.

The current economic engine defaults to:

- 25% creator economics
- 35% collector rewards / drop funding
- 20% Voxel Vault platform revenue
- 20% operating and safety reserve

These percentages are configuration defaults, not promises. A production campaign must record its exact allocation before launch.

### Self-sustaining phase

When recurring sponsor revenue covers infrastructure, creator production, rewards, reserve targets and operating costs, bootstrap contribution can fall toward zero.

Popularity must never be treated as guaranteed revenue. Revenue must come from measurable campaign demand, creator supply, collector activity, marketplace volume, or other explicit commercial flows.

## Campaign formats

### 1. Sponsored 3D drop

A limited 3D collectible appears at a public discovery zone.

Bluetooth can enhance discovery on supported devices. QR remains a cross-platform discovery path. Neither grants ownership. The wallet authorizes the claim and the chain settles it.

### 2. Sponsored hunt

A sponsor funds a multi-stop scavenger route. Each stop reveals a piece, clue, cosmetic, or collectible. Completing the route can unlock a final limited object.

### 3. Sponsored creator series

A creator designs a coherent set of branded-but-collectible objects. The brand funds production without controlling the creator's entire aesthetic.

### 4. Sponsored utility object

A collectible can unlock a discount, event ticket, digital experience, game cosmetic, or other utility after ownership is verified.

### 5. Seasonal world event

Multiple sponsors can fund a shared Voxel Vault event with distinct collectible families and transparent campaign provenance.

## What makes the advertising model different

Traditional ads ask users to stop collecting and look at an ad.

Voxel Vault's model asks the sponsor to fund something worth collecting.

Useful campaign metrics can include:

- discovery starts
- 3D inspections
- claims
- completed hunts
- verified owners
- repeat visits
- secondary-market activity
- utility redemptions
- campaign completion rate

Metrics should only be reported after the corresponding events are actually measured.

## Anti-abuse rules

- Sponsorship cannot grant ownership by itself.
- A sponsor cannot bypass wallet authorization.
- Campaign budgets are fixed before launch.
- Reward pools cannot exceed funded campaign allocations.
- Drop capacity is finite and server-controlled.
- Campaign claims require anti-replay and settlement verification.
- Sponsor metadata is immutable for a published campaign except through an auditable campaign update flow.
- No fake scarcity, fake collector counts, fake volume or fake engagement metrics.
- Sponsored status is always recoverable from collectible provenance.

## Product hierarchy

1. **Discovery** gets the user curious.
2. **3D quality** makes the object worth inspecting.
3. **Collection** gives the user a reason to keep it.
4. **Ownership** makes the relationship real.
5. **Utility / trading** gives the object continued value.
6. **Sponsorship** funds the ecosystem without becoming the ecosystem.

If sponsorship ever becomes more important than the collectible experience, the product has drifted.

## Vertical slice

**Sponsor funds campaign → creator produces 3D object → campaign publishes disclosed sponsored collectible → user discovers it via QR/Bluetooth → 3D object is revealed → wallet authorizes claim → blockchain settles → server verifies settlement → collector owns the object → campaign records a verified claim → reward pool reconciles → sponsor receives transparent campaign metrics.**

That is the seam-welded version of the idea.

# Voxel Vault $1,000 Investment Plan

This is a staged operating budget, not a promise of profit. The goal is to maximize learning and reliability while keeping irreversible spending late.

| Bucket | Planned amount | Release condition |
|---|---:|---|
| Testnet + L2 experiments | $100 | End-to-end mint/list/buy flow works |
| Infrastructure | $200 | Production traffic or pilot requires durable services |
| Creator/sponsor pilot | $200 | Product loop is stable enough for real participants |
| Security review | $250 | Contracts have frozen scope and passing tests |
| Monitoring/load/abuse testing | $100 | Before opening the system to larger traffic |
| Operating reserve | $150 | Held back until real usage exposes the next bottleneck |
| **Total** | **$1,000** | |

## Spending rules

- Never put the entire $1,000 into chain deployment or gas.
- Never fund rewards before the reward accounting is implemented and tested.
- Never pay for large-scale traffic before the asset delivery path is CDN/object-storage ready.
- Freeze contract scope before paying for an independent contract review.
- Keep a reserve for unexpected infrastructure or remediation costs.
- Measure one complete user loop before increasing spend.

## Success checkpoints

### Checkpoint A

A user can discover a collectible, inspect it in 3D, connect a wallet, and complete the intended testnet transaction without manual intervention.

### Checkpoint B

A creator can publish an asset and see it represented consistently in the Vault.

### Checkpoint C

A marketplace transaction produces correct royalty, fee, and seller balances on-chain.

### Checkpoint D

A claim is durable across server restarts and multiple application instances when Supabase is configured.

### Checkpoint E

A load test can generate sustained gallery traffic without the browser DOM growing without bound or the API state becoming instance-local.

## Revenue thesis to validate

Do not optimize for raw visitor count first. Validate whether a visitor can become a repeat collector, creator, sponsor, or marketplace participant.

The strongest early signal is not "people looked at NFTs." It is:

**people discovered → acted → returned.**

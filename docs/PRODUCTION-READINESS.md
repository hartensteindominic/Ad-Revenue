# Voxel Vault Production Readiness

## Current truth

The current repository is a Next.js 15 + React 19 application with Ethereum contracts using OpenZeppelin 5.4. The deployed experience intentionally uses a deterministic generated catalog and keeps the gallery DOM bounded while loading more objects as the user scrolls.

The current Solidity code is **not** the sponsored-campaign contract described in the external review. The repository currently contains `VoxelVaultNFT` and `VoxelVaultMarketplace`. Therefore campaign-budget findings about `createCampaign()`, `budgetWei`, campaign reservation mappings, and collector reward splits do not map to the current Solidity files.

## Findings confirmed in the repository

### Good foundations

- `VoxelVaultNFT` caps royalties at 15%.
- Mainnet deployment requires an explicit `CONFIRM_MAINNET=yes` gate and checks chain ID 1.
- Mainnet deployment disables public mint by default when the deployer is the owner.
- The marketplace uses `ReentrancyGuard` and `Pausable` on value-moving paths.
- Marketplace payouts use pull withdrawals through `pendingWithdrawals`, avoiding direct push-payment griefing.
- Claim tickets use Node `randomBytes()` rather than `Math.random()`.
- Claim responses explicitly distinguish authorization from actual on-chain ownership.
- Supabase is already present as the durable storage path for drops and claims when configured.

## Hard launch gates

Do not treat a green UI deployment as a green financial deployment.

1. `npm run build` passes.
2. `npm run chain:compile` passes.
3. `npx hardhat test` passes.
4. Test the marketplace on Base Sepolia or another chosen L2 testnet before mainnet.
5. Verify both contracts on the block explorer.
6. Use a multisig as the production owner.
7. Confirm public mint is disabled unless the intended mint path has been audited.
8. Confirm Vercel production variables point to the exact deployed contracts and chain.
9. Configure Supabase before enabling production claims. Do not silently fall back to ephemeral memory for production economic state.
10. Add monitoring for API errors, checkout failures, chain failures, and claim settlement failures before paid acquisition.

## Scale architecture

### Frontend

Keep the infinite-gallery illusion, but keep the DOM bounded. The current gallery already trims loaded cards to a small rolling window, which is the right pattern for a long-running feed.

### API

Use stateless route handlers. Persistent economic state belongs in Supabase/Postgres. Hot, short-lived reservation state can later use Redis or another TTL store.

### Blockchain

Treat the chain as the ownership authority. The server may authorize a claim, but it must never label the collectible as owned until the chain transaction is confirmed.

### 3D delivery

Keep large GLB/GLTF payloads out of the Next.js application bundle. Use object storage/IPFS plus a CDN, and lazy-load full 3D viewers only when needed.

## $1,000 staged capital plan

The money should unlock proof, not merely add features.

### Stage 0: $0 to $100

- Testnet gas and deployment experiments.
- Domain/observability essentials only if genuinely needed.
- No mainnet contract deployment.

### Stage 1: $100 to $300 cumulative

- A real end-to-end sponsored/drop experiment on an L2 testnet.
- Creator prototype assets.
- Load testing and failure testing.

### Stage 2: $300 to $600 cumulative

- Durable production database and monitoring.
- CDN/object storage for 3D assets.
- Small creator/sponsor pilot budget.

### Stage 3: $600 to $850 cumulative

- Independent Solidity review of the exact deployed bytecode and source.
- Abuse/rate-limit testing.
- Production analytics and settlement monitoring.

### Stage 4: $850 to $1,000 cumulative

Keep the remainder as operating reserve until the product has real usage. Do not spend the final dollars merely because the budget exists.

## Product principle

The endless scroll is not just decoration. It creates the feeling that the Vault is alive. Preserve that sensation while making the underlying system finite per request, deterministic, cacheable, and bounded in memory.

The long-term loop should be:

**discover → inspect → claim/buy → own → trade → return → discover again**

The investment plan should fund the parts that make that loop trustworthy and repeatable.

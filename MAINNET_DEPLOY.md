# Ethereum mainnet deployment (Voxel Vault)

This deploys **real** contracts on **Ethereum mainnet** (chainId 1). Gas is paid in **real ETH**.

## Before you start

1. Contracts were hardened (pause, auction fix, public-mint gate) but **are not a substitute for an audit**.
2. Prefer a **multisig** as `MULTISIG_OWNER` and `FEE_RECIPIENT`.
3. Never put `DEPLOYER_PRIVATE_KEY` in Vercel, GitHub, or chat.
4. Fund the deployer with enough ETH for deploy + `setMinter` / `setPublicMintEnabled` (often ~0.05+ ETH depending on gas).

## Local `.env` (do not commit)

```bash
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_HOT_WALLET_KEY
CONFIRM_MAINNET=yes

# Strongly recommended:
MULTISIG_OWNER=0xYourMultisig
FEE_RECIPIENT=0xYourTreasuryOrMultisig

# Default is public mint OFF. Only set false if you intentionally want open mint:
# DISABLE_PUBLIC_MINT=false

ETHERSCAN_API_KEY=optional_for_verify
```

## Commands

```bash
npm install
npm run chain:compile
npm run chain:deploy:mainnet
```

The script refuses to run if:

- `CONFIRM_MAINNET` is not `yes`
- RPC chainId is not `1`
- Deployer has 0 ETH

Output includes:

```text
NEXT_PUBLIC_VOXEL_NFT_ADDRESS=0x...
NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=0x...
```

Addresses are also written to `deployed-mainnet-addresses.json` (gitignored if you add it).

## If owner is a multisig

From the multisig, execute:

1. `nft.setMinter(marketAddress, true)`
2. `nft.setPublicMintEnabled(false)` (recommended)

## Vercel production env

```bash
NEXT_PUBLIC_EVM_CHAIN_ID=0x1
NEXT_PUBLIC_EVM_CHAIN_NAME=Ethereum
NEXT_PUBLIC_EVM_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_VOXEL_NFT_ADDRESS=0x...
NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=0x...
```

Redeploy the Next.js app after setting these.

## Verify on Etherscan (optional)

```bash
npx hardhat verify --network mainnet <NFT_ADDRESS> <OWNER_ADDRESS>
npx hardhat verify --network mainnet <MARKET_ADDRESS> <OWNER_ADDRESS> <NFT_ADDRESS> <FEE_RECIPIENT>
```

## After deploy canary

1. Connect MetaMask to Ethereum mainnet on the live site.
2. Mint or marketplace action with a **small** amount of ETH.
3. Confirm explorer links and `withdraw()` for fees if applicable.
4. Monitor contract balances and pause if something is wrong: `market.pause()`.

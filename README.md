# Voxel Vault 🧊💜

A 3D voxel NFT marketplace built around interactive models, creator publishing and real wallet ownership.

## Marketplace stack

- Next.js + React + Three.js for the Voxel Vault experience
- MetaMask / browser wallets through `ethers` v6
- ERC-721 NFTs with per-token metadata
- ERC-2981 royalty signaling through OpenZeppelin
- Marketplace listings, fixed-price purchases, offers and timed auctions
- Sepolia-first deployment workflow
- GLB / GLTF assets referenced from IPFS or HTTPS metadata
- Supabase + Stripe remain available for off-chain account and checkout features

OpenZeppelin's ERC-721 implementation supports the standard ownership and metadata interfaces, while `ERC721Royalty` exposes ERC-2981 royalty information. ERC-2981 signals royalty information but does not force every external marketplace to pay it, so Voxel Vault's own marketplace contract explicitly routes the royalty during its own sales. citehttps://docs.openzeppelin.com/contracts/5.x/api/token/erc721

## Smart contracts

- `contracts/VoxelVaultNFT.sol` — ERC-721 + URI storage + ERC-2981 royalties.
- `contracts/VoxelVaultMarketplace.sol` — listings, purchases, offers, auctions, marketplace fee and withdrawal accounting.
- `scripts/deploy-sepolia.js` — deploys both contracts and transfers NFT minting ownership to the marketplace.

## Deploy to Sepolia

Create a local `.env` file:

```text
SEPOLIA_RPC_URL=your_sepolia_rpc_url
DEPLOYER_PRIVATE_KEY=your_testnet_wallet_private_key
```

Never commit this file or expose a private key in Vercel, GitHub, browser code or chat.

Then run:

```bash
npm install
npm run chain:compile
npm run chain:deploy:sepolia
```

The deployment script prints two addresses:

```text
NEXT_PUBLIC_VOXEL_NFT_ADDRESS=...
NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=...
```

Add those two values to the Vercel project's environment variables, redeploy, and the marketplace UI will switch from **contract code ready** to **Sepolia contracts configured**.

## Important production note

The contracts are an initial marketplace implementation, not a substitute for an independent smart-contract security audit. Test on Sepolia first, verify every transaction and event, and do not fund a mainnet deployment until the contract behavior has been reviewed.

## Production build status

Voxel Vault production build fixes are being verified before the next marketplace upgrade.

# Voxel Vault Master Build Plan

## Product north star

Voxel Vault is a 3D collectible network: create, mint, discover, own, display, hunt, trade and transfer realistic digital objects through wallets and mobile devices.

The product loop is:

**CREATE → DISCOVER → OWN → DISPLAY → TRADE → DISCOVER AGAIN**

## Build order

### 1. Production foundation
- Keep `main` stable.
- Develop feature work on branches.
- Use preview deployments before production.
- Verify mobile and desktop behavior after each meaningful change.
- Never place private keys or seed phrases in the repository or client bundle.

### 2. Universal collectible engine
The canonical object schema is `voxel-vault/universal-collectible`.

It carries:
- object family and subtype
- creation mode
- rarity and traits
- canonical 3D asset reference
- creator
- blockchain identity
- ownership state
- provenance
- compatibility/platform metadata

Generation is separate from minting. A generated record is not an on-chain NFT until a wallet-signed transaction succeeds.

### 3. 3D asset pipeline
Target GLB/GLTF first. Add validation, previews, thumbnails, optimization and mobile-safe loading. The blockchain stores ownership/provenance while asset storage and CDN infrastructure deliver the larger 3D files.

### 4. Wallet and My Vault
Wallet ownership is authoritative on-chain. Application caches/indexes must never claim a transfer merely because an API returned success. Transaction hash and confirmation are required before presenting a settled state.

### 5. Marketplace
Support listing, buying, offers, auctions, royalties and withdrawals. Maintain escrow/conflict guards, reentrancy protections, fee limits and emergency controls. Contract behavior must be covered by unit and integration tests before mainnet.

### 6. Universal mobile trade
QR, deep links and eventually NFC are transport mechanisms. They identify or carry a trade intent; they do not themselves transfer an NFT. The wallet authorizes the transaction and the blockchain settles ownership.

### 7. Voxel Hunt
Add map-based drops, discovery, signed claims, rate limits and anti-abuse controls. GPS is treated as an input and never as unquestionable proof of location.

### 8. Creator Studio
Creators can stage GLB/GLTF assets, define metadata, traits, rarity, supply and royalties, preview the collectible and initiate minting.

### 9. AI Curator
Use AI for collection intelligence, discovery, metadata assistance, trait organization and trade suggestions. AI recommendations never override blockchain ownership or transaction authorization.

### 10. Interoperability
Maintain one canonical asset and use compatibility adapters for external ecosystems. Never label an asset as compatible with a platform until its actual format and publishing requirements have been verified.

### 11. Scale and reliability
Separate frontend, API, database, blockchain, indexing, object storage and CDN responsibilities. Add monitoring, caching, rate limiting and retry/reconciliation workflows as usage grows.

## Release gates

### Gate A: stable web app
- no client-side crashes
- no blank/white controls
- responsive mobile layout
- 3D fallback when WebGL/model loading fails
- navigation and primary actions verified

### Gate B: testnet lifecycle
Run repeatedly:

`CREATE → MINT → VIEW → LIST → BUY → OFFER → AUCTION → SETTLE → TRANSFER → TRADE → HUNT → CLAIM`

Test wallet disconnects, rejected transactions, refreshes, slow connections, RPC failures and database failures.

### Gate C: security
- contract tests
- access-control review
- reentrancy review
- auction/offer lifecycle review
- controlled minting for mainnet
- pause/circuit breaker
- multisig ownership
- separated fee recipient/treasury
- independent smart-contract audit before significant mainnet funds

### Gate D: production
`feature branch → checks → Vercel preview → browser/mobile verification → PR → main → production deployment → smoke test → monitoring`

## Current milestone

The current feature branch begins the next foundation milestone by replacing the old fixed demo-object panel with a procedural universal collectible generator. Generated records are validated against the canonical schema and explicitly remain unminted until a wallet-signed blockchain action occurs.

## Non-goals

- Do not pretend GPS is secure proof.
- Do not pretend a QR scan itself transfers an NFT.
- Do not claim automatic compatibility with an external metaverse without verifying its requirements.
- Do not launch unrestricted public minting with real mainnet funds.
- Do not put private keys in frontend environment variables or source code.

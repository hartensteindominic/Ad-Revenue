# Voxel Vault 100k NFT Engine

The repository now contains a deterministic production pipeline for the fixed 100,000-edition Voxel Vault collection.

## Pipeline

1. Generate deterministic traits and exact global rarity buckets.
2. Render 1024px voxel art with PIL, without matplotlib.
3. Write ERC-721/OpenSea-compatible metadata with DNA hashes.
4. Verify image/metadata parity and DNA uniqueness.
5. Upload images to Pinata in directory batches.
6. Rewrite metadata with immutable `ipfs://` image URIs.
7. Upload metadata in directory batches.
8. Emit `ipfs-manifest/token-uris.json` for the deployed NFT contract.
9. Mint selected editions with `scripts/mint_from_manifest.js`.

## Install

```bash
python3 -m pip install -r requirements-nft.txt
```

## Generate

Preview the full collection's trait distribution without rendering:

```bash
python3 scripts/generate_collection.py --start 1 --end 100000 --preview
```

Generate the collection:

```bash
python3 scripts/generate_collection.py \
  --start 1 \
  --end 100000 \
  --workers 8 \
  --output ./collection
```

The generator is deterministic. The same token ID and engine version produce the same traits and DNA.

## Verify

```bash
python3 scripts/verify_collection.py --dir ./collection
```

For the complete 100k range, rarity counts are required to be exactly:

- Common: 60,000
- Uncommon: 25,000
- Rare: 10,000
- Epic: 4,000
- Legendary: 1,000

## Upload to IPFS

Set the Pinata JWT in the environment. Never commit the JWT.

```bash
export PINATA_JWT='...'
python3 scripts/upload_to_ipfs.py \
  --images ./collection/images \
  --metadata ./collection/metadata \
  --batch-size 500 \
  --output ./ipfs-manifest
```

Because the deployed `VoxelVaultNFT` uses ERC-721 URI storage, metadata does not need one giant collection CID. Every edition receives its own immutable IPFS URI from the manifest.

## Mint

The currently configured NFT contract is:

`0xC6eb3c79139DFDD09D566Ca0b6e2C4F173E1fbcd`

Do not mint the full collection automatically. Mainnet minting is irreversible and consumes gas. Mint a deliberate range only after verifying the IPFS manifest:

```bash
export MAINNET_RPC_URL='...'
export DEPLOYER_PRIVATE_KEY='...'

node scripts/mint_from_manifest.js \
  --manifest ./ipfs-manifest/token-uris.json \
  --start 1 \
  --end 10 \
  --recipient 0x... \
  --royalty-receiver 0x... \
  --royalty-bps 500
```

The mint script checks that the signing wallet is the deployed NFT owner or an approved minter and refuses royalty rates above the contract's 1500 BPS limit.

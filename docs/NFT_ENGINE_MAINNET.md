# Mainnet NFT Engine Notes

The 100k collection engine is isolated from the website UI. It generates deterministic DNA, renders 1024px PNG assets, creates ERC-721 metadata, verifies rarity allocation and DNA uniqueness, uploads assets/metadata to public IPFS in bounded Pinata folder batches, and writes a token URI mint manifest.

Pinata folder uploads use the legacy `pinFileToIPFS` endpoint because the current V3 file upload endpoint does not support folder uploads. Batches are represented by their own directory CID and token URIs include the batch path.

Never commit `PINATA_JWT` or a signer private key. The mint script must be invoked with an explicit token range.

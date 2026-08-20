#!/usr/bin/env python3
"""Upload a generated Voxel Vault collection to Pinata.

The contract uses ERC-721 URI storage, so metadata can safely be split into
multiple IPFS directory batches. The script emits token-uris.json for minting.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib.nft_engine.ipfs import PinataUploader, write_json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--output", default="./ipfs-manifest")
    parser.add_argument("--batch-size", type=int, default=500)
    args = parser.parse_args()

    image_dir = Path(args.images)
    metadata_dir = Path(args.metadata)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    uploader = PinataUploader()

    print("1/3 Uploading image batches...")
    image_uris = uploader.upload_directory(image_dir, batch_size=args.batch_size)
    write_json(output / "image-uris.json", image_uris)

    print("2/3 Rewriting metadata image URIs...")
    for metadata_path in sorted(metadata_dir.glob("*.json")):
        token_id = int(metadata_path.stem)
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata["image"] = image_uris[token_id]
        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print("3/3 Uploading metadata batches...")
    token_uris = uploader.upload_directory(metadata_dir, batch_size=args.batch_size)
    write_json(output / "token-uris.json", {str(k): v for k, v in sorted(token_uris.items())})

    print("\nIPFS upload complete.")
    print(f"Mint manifest: {output / 'token-uris.json'}")
    print("Each token URI is immutable and can be passed directly to VoxelVaultNFT.mintTo().")


if __name__ == "__main__":
    main()

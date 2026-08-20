#!/usr/bin/env python3
"""Verify image/metadata counts, DNA uniqueness, and exact rarity distribution."""

import argparse
import json
from collections import Counter
from pathlib import Path

from lib.nft_engine.config import MAX_SUPPLY, RARITY_COUNTS


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", required=True, help="Generated collection directory")
    args = parser.parse_args()

    root = Path(args.dir)
    image_dir = root / "images"
    metadata_dir = root / "metadata"
    images = {int(p.stem) for p in image_dir.glob("*.png")}
    metadata = {int(p.stem) for p in metadata_dir.glob("*.json")}

    print(f"Images: {len(images):,}")
    print(f"Metadata: {len(metadata):,}")
    if images != metadata:
        print("ERROR: image/metadata token sets differ")
        missing_images = sorted(metadata - images)[:10]
        missing_metadata = sorted(images - metadata)[:10]
        print("Missing images:", missing_images)
        print("Missing metadata:", missing_metadata)
        raise SystemExit(1)

    dna = []
    rarities = Counter()
    for token_id in sorted(metadata):
        payload = json.loads((metadata_dir / f"{token_id}.json").read_text(encoding="utf-8"))
        dna.append(payload.get("dna"))
        rarity = next((a["value"] for a in payload.get("attributes", []) if a.get("trait_type") == "Rarity"), None)
        rarities[rarity] += 1
        if not payload.get("image", "").startswith("ipfs://"):
            print(f"ERROR: token {token_id} has no IPFS image URI")
            raise SystemExit(1)

    if None in dna or len(set(dna)) != len(dna):
        print("ERROR: DNA collision or missing DNA detected")
        raise SystemExit(1)

    print(f"DNA unique: {len(set(dna)):,}/{len(dna):,}")
    print("Rarity distribution:")
    for rarity, expected in RARITY_COUNTS.items():
        actual = rarities[rarity]
        print(f"  {rarity}: {actual:,} (expected {expected:,})")
        if len(metadata) == MAX_SUPPLY and actual != expected:
            raise SystemExit(f"ERROR: exact {rarity} count mismatch")

    manifest = root / "_manifest.json"
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        if data.get("dna_unique") != len(dna):
            raise SystemExit("ERROR: manifest DNA count mismatch")

    print("\nCollection verification PASSED.")


if __name__ == "__main__":
    main()

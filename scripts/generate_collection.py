#!/usr/bin/env python3
"""Generate deterministic Voxel Vault images + metadata.

Examples:
  python scripts/generate_collection.py --start 1 --end 1000 --workers 8 --output ./collection
  python scripts/generate_collection.py --start 1 --end 100000 --workers 8 --output ./collection
  python scripts/generate_collection.py --start 1 --end 100000 --preview
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.nft_engine.config import MAX_SUPPLY, PALETTE_COLORS, RARITY_COUNTS
from lib.nft_engine.deterministic import DeterministicGenerator, rarity_map
from lib.nft_engine.metadata import MetadataBuilder
from lib.nft_engine.renderer import VoxelRenderer


def generate_one(args):
    token_id, rarity, output, image_base_uri = args
    try:
        generator = DeterministicGenerator()
        traits = generator.generate_traits(token_id, rarity=rarity)
        traits["_palette_hex"] = PALETTE_COLORS[traits["Palette"]]

        output = Path(output)
        image_dir = output / "images"
        metadata_dir = output / "metadata"
        image_dir.mkdir(parents=True, exist_ok=True)
        metadata_dir.mkdir(parents=True, exist_ok=True)

        image_path = image_dir / f"{token_id}.png"
        metadata_path = metadata_dir / f"{token_id}.json"

        if not image_path.exists():
            VoxelRenderer(1024).render(token_id, traits).save(image_path, "PNG", optimize=True)

        metadata = MetadataBuilder(image_base_uri).build(
            token_id,
            traits,
            image_uri=f"{image_base_uri.rstrip('/')}/{token_id}.png",
        )
        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        return token_id, True, traits["Rarity"], traits["_hash"], ""
    except Exception as exc:
        return token_id, False, rarity, "", repr(exc)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=100)
    parser.add_argument("--output", default="./collection")
    parser.add_argument("--workers", type=int, default=max(1, min(8, os.cpu_count() or 1)))
    parser.add_argument("--image-base-uri", default="ipfs://PENDING_IMAGE_CID")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    if args.start < 1 or args.end > MAX_SUPPLY or args.start > args.end:
        raise SystemExit(f"Token range must be 1..{MAX_SUPPLY:,}")

    count = args.end - args.start + 1
    print(f"Voxel Vault | #{args.start:,} -> #{args.end:,} | {count:,} editions")

    if args.preview:
        frequencies = DeterministicGenerator().get_trait_frequencies(args.start, args.end)
        for trait, values in frequencies.items():
            print(f"\n{trait}")
            for value, amount in sorted(values.items(), key=lambda item: -item[1]):
                print(f"  {value}: {amount} ({amount / count * 100:.2f}%)")
        return

    output = Path(args.output)
    (output / "images").mkdir(parents=True, exist_ok=True)
    (output / "metadata").mkdir(parents=True, exist_ok=True)

    # Build the exact global rarity assignment once. Workers receive only their
    # assigned tier, avoiding a 100k-item rarity sort in every worker process.
    all_rarities = rarity_map()
    tasks = [(tid, all_rarities[tid], str(output), args.image_base_uri) for tid in range(args.start, args.end + 1)]

    started = time.time()
    successes = 0
    failures = []
    dna = set()

    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(generate_one, task) for task in tasks]
        for index, future in enumerate(as_completed(futures), 1):
            token_id, ok, rarity, dna_hash, error = future.result()
            if ok:
                successes += 1
                if dna_hash in dna:
                    failures.append((token_id, "DNA collision"))
                dna.add(dna_hash)
            else:
                failures.append((token_id, error))
            if index == 1 or index % 100 == 0 or index == count:
                elapsed = time.time() - started
                rate = index / elapsed if elapsed else 0
                eta = (count - index) / rate if rate else 0
                print(f"Progress {index:,}/{count:,} | {rate:.2f}/s | ETA {eta / 60:.1f}m")

    manifest = {
        "collection": "Voxel Vault",
        "max_supply": MAX_SUPPLY,
        "start_token": args.start,
        "end_token": args.end,
        "generated": successes,
        "failures": len(failures),
        "dna_unique": len(dna),
        "rarity_counts": RARITY_COUNTS,
        "image_base_uri": args.image_base_uri,
        "generated_at": int(time.time()),
        "engine": "VoxelVaultEngine v3.1",
    }
    (output / "_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    if failures:
        (output / "_failures.json").write_text(json.dumps(failures, indent=2) + "\n", encoding="utf-8")

    elapsed = time.time() - started
    print(f"Complete: {successes:,}/{count:,} in {elapsed / 60:.1f}m")
    if failures:
        print(f"Failures/collisions: {len(failures)}. See {output / '_failures.json'}")
        raise SystemExit(2)


if __name__ == "__main__":
    main()

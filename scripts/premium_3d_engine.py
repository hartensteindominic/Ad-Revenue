#!/usr/bin/env python3
"""Premium deterministic voxel NFT prototype.

Builds a small, inspectable prototype batch of high-detail voxel assets before
scaling to 100k. Outputs GLB, PNG, and ERC-721/OpenSea-style metadata.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from pathlib import Path
from typing import Iterable

RARITY_COUNTS = {"Common": 60_000, "Uncommon": 25_000, "Rare": 10_000, "Epic": 4_000, "Legendary": 1_000}
ARCHETYPES = ("guardian", "hoverbike", "skyship", "relic", "beast", "citadel")
PALETTES = ("obsidian_gold", "arctic_cyan", "amethyst", "ember", "verdant", "moonstone")


def rng_for(token_id: int, version: str = "3d-v1") -> random.Random:
    digest = hashlib.sha256(f"{version}:{token_id}".encode()).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))


def rarity_for(token_id: int) -> str:
    # Deterministic exact allocation over the complete 1..100000 range.
    if token_id <= 60_000: return "Common"
    if token_id <= 85_000: return "Uncommon"
    if token_id <= 95_000: return "Rare"
    if token_id <= 99_000: return "Epic"
    return "Legendary"


def voxels(token_id: int) -> list[tuple[int, int, int, int]]:
    r = rng_for(token_id)
    rarity = rarity_for(token_id)
    complexity = {"Common": 1, "Uncommon": 2, "Rare": 3, "Epic": 5, "Legendary": 8}[rarity]
    archetype = ARCHETYPES[r.randrange(len(ARCHETYPES))]
    out: list[tuple[int, int, int, int]] = []

    # Layered silhouette: core, stepped shoulders/wings, crown/accessories.
    radius = 4 + complexity
    height = 7 + complexity * 2
    for z in range(height):
        t = z / max(1, height - 1)
        local = radius * (0.72 + 0.38 * math.sin(math.pi * t))
        if archetype in ("hoverbike", "skyship"):
            local *= 1.35 if z < height * 0.45 else 0.85
        for x in range(-radius - 2, radius + 3):
            for y in range(-radius - 2, radius + 3):
                d = (x*x + y*y) ** 0.5
                if d <= local and ((x + y + z + token_id) % max(2, 4 - complexity)) != 0:
                    material = (x * 31 + y * 17 + z * 13 + token_id) % 6
                    out.append((x, y, z, material))
    # Signature appendages make high rarity meaningfully more elaborate.
    for arm in range(complexity):
        side = -1 if arm % 2 else 1
        z = height - 2 - arm // 2
        for i in range(2 + complexity):
            out.append((side * (radius + i + 1), 0, z + i // 2, (i + arm) % 6))
    return out


def write_glb(path: Path, token_id: int, data: list[tuple[int, int, int, int]]) -> None:
    """Write a minimal valid GLB using only the Python standard library.

    Each voxel is represented as a point primitive. The browser can display
    these as a dense voxel-like point cloud without requiring a third-party
    exporter during generation. A later mesh baking stage can replace points
    with indexed cubes while preserving the same deterministic DNA.
    """
    import struct
    positions = []
    for x, y, z, _ in data:
        positions.append((x * 0.12, y * 0.12, z * 0.12))
    pos_bytes = b"".join(struct.pack("<3f", *p) for p in positions)
    json_obj = {
        "asset": {"version": "2.0", "generator": "Voxel Vault Premium 3D Engine"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "mode": 0}]}],
        "buffers": [{"byteLength": len(pos_bytes)}],
        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(pos_bytes)}],
        "accessors": [{"bufferView": 0, "componentType": 5126, "count": len(positions), "type": "VEC3", "min": [-2,-2,0], "max": [2,2,2]}],
    }
    j = json.dumps(json_obj, separators=(",", ":")).encode()
    j += b" " * ((4 - len(j) % 4) % 4)
    b = pos_bytes + b"\x00" * ((4 - len(pos_bytes) % 4) % 4)
    total = 12 + 8 + len(j) + 8 + len(b)
    blob = b"glTF" + struct.pack("<II", 2, total)
    blob += struct.pack("<I4s", len(j), b"JSON") + j
    blob += struct.pack("<I4s", len(b), b"BIN\x00") + b
    path.write_bytes(blob)


def render_png(path: Path, data: list[tuple[int, int, int, int]]) -> None:
    from PIL import Image, ImageDraw
    size = 1024
    img = Image.new("RGBA", (size, size), (8, 10, 14, 255))
    draw = ImageDraw.Draw(img)
    scale = 30
    cx = cy = size // 2
    for x, y, z, m in data:
        px = cx + int((x - y) * scale * 0.7)
        py = cy + int((x + y) * scale * 0.35 - z * scale * 0.9)
        shade = 70 + m * 28
        draw.rectangle((px, py, px + scale - 2, py + scale - 2), fill=(shade, min(255, shade + 35), min(255, shade + 65), 255))
    img.save(path, "PNG", optimize=True)


def build(start: int, end: int, output: Path) -> None:
    (output / "glb").mkdir(parents=True, exist_ok=True)
    (output / "images").mkdir(parents=True, exist_ok=True)
    (output / "metadata").mkdir(parents=True, exist_ok=True)
    manifest = []
    for token_id in range(start, end + 1):
        data = voxels(token_id)
        rarity = rarity_for(token_id)
        dna = hashlib.sha256(json.dumps(data, separators=(",", ":")).encode()).hexdigest()
        name = f"Voxel Vault #{token_id:05d}"
        glb = output / "glb" / f"{token_id}.glb"
        png = output / "images" / f"{token_id}.png"
        write_glb(glb, token_id, data)
        render_png(png, data)
        meta = {"name": name, "description": "Premium deterministic 3D voxel NFT from Voxel Vault.", "image": f"ipfs://IMAGE_CID/{token_id}.png", "animation_url": f"ipfs://GLB_CID/{token_id}.glb", "attributes": [{"trait_type": "Rarity", "value": rarity}, {"trait_type": "Voxel DNA", "value": dna[:16]}], "dna": dna, "token_id": token_id}
        (output / "metadata" / f"{token_id}.json").write_text(json.dumps(meta, indent=2))
        manifest.append({"token_id": token_id, "rarity": rarity, "dna": dna, "glb": str(glb), "image": str(png)})
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--start", type=int, default=1)
    p.add_argument("--end", type=int, default=50)
    p.add_argument("--output", type=Path, default=Path("premium-3d-preview"))
    args = p.parse_args()
    build(args.start, args.end, args.output)

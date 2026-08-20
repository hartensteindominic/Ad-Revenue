"""ERC-721 / OpenSea metadata builder."""

import json
import time
from pathlib import Path
from typing import Dict


RARITY_SCORE = {"Common": 1.0, "Uncommon": 2.5, "Rare": 6.0, "Epic": 15.0, "Legendary": 50.0}


class MetadataBuilder:
    def __init__(self, base_uri: str, collection_name: str = "Voxel Vault"):
        self.base_uri = base_uri.rstrip("/") + "/"
        self.collection_name = collection_name

    def build(self, token_id: int, traits: Dict, image_uri: str | None = None) -> Dict:
        image = image_uri or f"{self.base_uri}{token_id}.png"
        attributes = []
        for key, value in traits.items():
            if key.startswith("_") or key in ("token_id", "Name"):
                continue
            attributes.append({"trait_type": key, "value": value})

        rarity = traits.get("Rarity", "Common")
        score = RARITY_SCORE.get(rarity, 1.0)
        if traits.get("Effect") != "None":
            score *= 1.5
        if rarity == "Legendary" and traits.get("Effect") == "Hologram":
            score *= 2

        return {
            "name": f"{self.collection_name} #{token_id:05d} - {traits.get('Name', 'Artifact')}",
            "description": (
                f"A deterministic voxel sculpture from the {self.collection_name} collection. "
                f"Every edition is generated from immutable token DNA."
            ),
            "image": image,
            "external_url": f"https://voxel-vault.vercel.app/nft/{token_id}",
            "attributes": attributes,
            "compiler": "VoxelVaultEngine v3.1",
            "dna": traits["_hash"],
            "edition": token_id,
            "date": int(time.time()),
            "rarity_score": round(score, 2),
        }

    @staticmethod
    def save(token_id: int, metadata: Dict, output_dir: Path) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / f"{token_id}.json"
        path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        return path

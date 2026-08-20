"""Deterministic trait and rarity generation.

The rarity assignment is exact across token IDs 1..MAX_SUPPLY: tokens are ranked
by a SHA-256 score and assigned to the configured rarity buckets. All other
traits are deterministic weighted choices derived from the token ID.
"""

import hashlib
import json
from functools import lru_cache
from typing import Dict, Iterable

from .config import MAX_SUPPLY, RARITY_COUNTS, TRAITS


def _digest(value: str) -> bytes:
    return hashlib.sha256(value.encode("utf-8")).digest()


@lru_cache(maxsize=1)
def rarity_map() -> Dict[int, str]:
    ranked = sorted(
        range(1, MAX_SUPPLY + 1),
        key=lambda token_id: _digest(f"voxel-vault:rarity:{token_id}"),
    )
    result: Dict[int, str] = {}
    cursor = 0
    for rarity, count in RARITY_COUNTS.items():
        for token_id in ranked[cursor:cursor + count]:
            result[token_id] = rarity
        cursor += count
    return result


class DeterministicGenerator:
    def __init__(self, max_supply: int = MAX_SUPPLY):
        if max_supply != MAX_SUPPLY:
            raise ValueError(f"This collection is fixed at {MAX_SUPPLY:,} tokens")
        self.max_supply = max_supply

    @staticmethod
    def _seed(token_id: int, layer: str) -> int:
        return int.from_bytes(_digest(f"voxel-vault:v3:{layer}:{token_id}"), "big")

    @staticmethod
    def _weighted(seed: int, options: Iterable[str], weights: Iterable[int]) -> str:
        options = list(options)
        weights = list(weights)
        target = seed % sum(weights)
        for option, weight in zip(options, weights):
            if target < weight:
                return option
            target -= weight
        return options[-1]

    def generate_traits(self, token_id: int) -> Dict:
        if not 1 <= token_id <= self.max_supply:
            raise ValueError(f"token_id must be between 1 and {self.max_supply}")

        traits = {"token_id": token_id}
        for name, (values, weights) in TRAITS.items():
            traits[name] = self._weighted(self._seed(token_id, name), values, weights)

        traits["Rarity"] = rarity_map()[token_id]
        traits["Name"] = self._name(token_id)
        canonical = {k: v for k, v in traits.items() if k != "token_id"}
        traits["_hash"] = hashlib.sha256(
            json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        return traits

    def _name(self, token_id: int) -> str:
        adjective = self._weighted(self._seed(token_id, "name-adjective"), [*__import__("lib.nft_engine.config", fromlist=["ADJECTIVES"]).ADJECTIVES], [1] * len(__import__("lib.nft_engine.config", fromlist=["ADJECTIVES"]).ADJECTIVES))
        noun = self._weighted(self._seed(token_id, "name-noun"), [*__import__("lib.nft_engine.config", fromlist=["NOUNS"]).NOUNS], [1] * len(__import__("lib.nft_engine.config", fromlist=["NOUNS"]).NOUNS))
        return f"{adjective} {noun}"

    def generate_range(self, start: int, end: int) -> Dict[int, Dict]:
        if start < 1 or end > self.max_supply or start > end:
            raise ValueError("Invalid token range")
        return {token_id: self.generate_traits(token_id) for token_id in range(start, end + 1)}

    def get_trait_frequencies(self, start: int, end: int) -> Dict[str, Dict[str, int]]:
        frequencies: Dict[str, Dict[str, int]] = {}
        for traits in self.generate_range(start, end).values():
            for key, value in traits.items():
                if key.startswith("_") or key == "token_id":
                    continue
                frequencies.setdefault(key, {}).setdefault(value, 0)
                frequencies[key][value] += 1
        return frequencies

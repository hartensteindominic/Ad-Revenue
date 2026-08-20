"""Deterministic trait and rarity generation for the fixed 100k collection."""

import hashlib
import json
from functools import lru_cache
from typing import Dict, Iterable

from .config import ADJECTIVES, NOUNS, MAX_SUPPLY, RARITY_COUNTS, TRAITS


def _digest(value: str) -> bytes:
    return hashlib.sha256(value.encode("utf-8")).digest()


@lru_cache(maxsize=1)
def rarity_map() -> Dict[int, str]:
    ranked = sorted(range(1, MAX_SUPPLY + 1), key=lambda tid: _digest(f"voxel-vault:rarity:{tid}"))
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
        options, weights = list(options), list(weights)
        target = seed % sum(weights)
        for option, weight in zip(options, weights):
            if target < weight:
                return option
            target -= weight
        return options[-1]

    def generate_traits(self, token_id: int, rarity: str | None = None) -> Dict:
        if not 1 <= token_id <= self.max_supply:
            raise ValueError(f"token_id must be between 1 and {self.max_supply}")
        traits = {"token_id": token_id}
        for name, (values, weights) in TRAITS.items():
            traits[name] = self._weighted(self._seed(token_id, name), values, weights)
        traits["Rarity"] = rarity or rarity_map()[token_id]
        traits["Name"] = self._weighted(self._seed(token_id, "name-adjective"), ADJECTIVES, [1] * len(ADJECTIVES)) + " " + self._weighted(self._seed(token_id, "name-noun"), NOUNS, [1] * len(NOUNS))
        canonical = {k: v for k, v in traits.items() if k != "token_id"}
        traits["_hash"] = hashlib.sha256(json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        return traits

    def generate_range(self, start: int, end: int) -> Dict[int, Dict]:
        if start < 1 or end > self.max_supply or start > end:
            raise ValueError("Invalid token range")
        return {tid: self.generate_traits(tid) for tid in range(start, end + 1)}

    def get_trait_frequencies(self, start: int, end: int) -> Dict[str, Dict[str, int]]:
        frequencies: Dict[str, Dict[str, int]] = {}
        for traits in self.generate_range(start, end).values():
            for key, value in traits.items():
                if key.startswith("_") or key == "token_id":
                    continue
                frequencies.setdefault(key, {}).setdefault(value, 0)
                frequencies[key][value] += 1
        return frequencies

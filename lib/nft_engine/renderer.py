"""Fast deterministic voxel renderer using PIL only."""

import math
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .config import PALETTE_COLORS

RGB = Tuple[int, int, int]


class VoxelRenderer:
    def __init__(self, size: int = 1024):
        self.size = size

    @staticmethod
    def _rgb(value: str) -> RGB:
        value = value.lstrip("#")
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]

    @staticmethod
    def _shade(color: RGB, light: float) -> RGB:
        light = max(0.35, min(1.25, light))
        return tuple(max(0, min(255, int(channel * light))) for channel in color)  # type: ignore[return-value]

    @staticmethod
    def _rng(seed: int) -> np.random.Generator:
        return np.random.default_rng(seed)

    def _voxels(self, creature: str, seed: int, rarity: str, palette: List[str]) -> List[Tuple[int, int, int, RGB]]:
        rng = self._rng(seed)
        complexity = {"Common": 55, "Uncommon": 80, "Rare": 115, "Epic": 155, "Legendary": 210}[rarity]
        colors = [self._rgb(c) for c in palette]
        result: List[Tuple[int, int, int, RGB]] = []

        def add(x: int, y: int, z: int) -> None:
            result.append((x, y, z, colors[int(rng.integers(0, len(colors)))]))

        if creature in ("Quadruped", "Biped", "Bot"):
            height = 5 if creature != "Bot" else 6
            for x in range(-2, 3):
                for y in range(height):
                    for z in range(-2, 3):
                        if rng.random() > 0.12:
                            add(x, y, z)
            for x in range(-2, 3):
                for y in range(height, height + 3):
                    for z in range(-1, 3):
                        if rng.random() > 0.10:
                            add(x, y, z)
            for x in (-2, 2):
                for z in (-2, 2):
                    for y in range(3):
                        add(x, y, z)
            if creature == "Bot":
                for y in range(height + 3, height + 6):
                    add(0, y, 0)
        elif creature == "Vehicle":
            for x in range(-2, 3):
                for y in range(3):
                    for z in range(-6, 7):
                        add(x, y, z)
            for x in (-3, 3):
                for z in (-4, 0, 4):
                    for y in range(3):
                        add(x, y, z)
        elif creature == "Structure":
            height = int(rng.integers(7, 15))
            for y in range(height):
                span = max(1, 4 - y // 3)
                for x in range(-span, span + 1):
                    for z in range(-span, span + 1):
                        add(x, y, z)
            for y in range(height, height + 4):
                add(0, y, 0)
        elif creature in ("Flying", "Celestial"):
            for i in range(complexity):
                angle = i * math.tau / complexity
                radius = 3 + int(rng.integers(0, 3))
                add(round(radius * math.cos(angle)), int(rng.integers(1, 6)), round(radius * math.sin(angle)))
            for y in range(4):
                add(0, y, 0)
        elif creature in ("Serpent", "Aquatic"):
            for i in range(complexity):
                t = i / max(1, complexity - 1)
                add(round(4 * math.sin(t * math.tau * 1.7)), i // 5, round(4 * math.cos(t * math.tau * 1.7)))
        else:
            seen = set()
            while len(seen) < complexity:
                point = (int(rng.integers(-6, 7)), int(rng.integers(-3, 9)), int(rng.integers(-6, 7)))
                if point not in seen:
                    seen.add(point)
                    add(*point)
        return result

    def render(self, token_id: int, traits: Dict) -> Image.Image:
        seed = int(traits["_hash"][:16], 16)
        rng = self._rng(seed)
        image = Image.new("RGBA", (self.size, self.size), (7, 10, 22, 255))
        draw = ImageDraw.Draw(image)
        voxels = self._voxels(traits["Creature"], seed, traits["Rarity"], PALETTE_COLORS[traits["Palette"]])

        rot_y = float(rng.random() * math.tau)
        rot_x = 0.35 + float(rng.random() * 0.25)
        scale = self.size / 9.0
        cy, sy = math.cos(rot_y), math.sin(rot_y)
        cx, sx = math.cos(rot_x), math.sin(rot_x)
        projected = []

        for x, y, z, color in voxels:
            xr = x * cy - z * sy
            zr = x * sy + z * cy
            yr = y * cx - zr * sx
            depth = y * sx + zr * cx
            factor = 1.0 / (1.0 + depth * 0.025)
            projected.append((depth, self.size / 2 + xr * scale * factor, self.size * 0.57 - yr * scale * factor, max(7, int(22 * factor)), color))

        projected.sort(key=lambda item: item[0], reverse=True)
        for depth, px, py, block, color in projected:
            base = self._shade(color, 0.78 + max(-0.2, min(0.35, (4 - depth) / 18)))
            x0, y0, x1, y1 = int(px - block), int(py - block), int(px + block), int(py + block)
            draw.rectangle((x0, y0, x1, y1), fill=base + (245,), outline=(255, 255, 255, 55), width=1)
            draw.line((x0 + 2, y0 + 2, x1 - 2, y0 + 2), fill=self._shade(base, 1.18) + (150,), width=2)
            draw.line((x1 - 2, y0 + 2, x1 - 2, y1 - 2), fill=self._shade(base, 0.55) + (180,), width=2)

        effect = traits.get("Effect", "None")
        if effect in ("Glow", "Hologram"):
            glow = image.filter(ImageFilter.GaussianBlur(18))
            glow.putalpha(55)
            image = Image.alpha_composite(glow, image)
        if effect == "Glitch":
            r, g, b, a = image.split()
            r = r.transform(image.size, Image.AFFINE, (1, 0, 3, 0, 1, 0))
            b = b.transform(image.size, Image.AFFINE, (1, 0, -3, 0, 1, 0))
            image = Image.merge("RGBA", (r, g, b, a))
        if effect == "Particles":
            draw = ImageDraw.Draw(image)
            for _ in range(70):
                x = int(rng.integers(20, self.size - 20))
                y = int(rng.integers(20, self.size - 20))
                draw.ellipse((x, y, x + 3, y + 3), fill=(255, 255, 255, 110))
        return image

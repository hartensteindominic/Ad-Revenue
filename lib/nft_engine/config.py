"""Configuration for the 100,000-piece Voxel Vault collection."""

MAX_SUPPLY = 100_000
RARITY_COUNTS = {
    "Common": 60_000,
    "Uncommon": 25_000,
    "Rare": 10_000,
    "Epic": 4_000,
    "Legendary": 1_000,
}

PALETTE_COLORS = {
    "Cyberpunk": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff", "#00f5ff"],
    "Magma": ["#ff006e", "#ffbe0b", "#fb5607", "#8b0000", "#dc143c", "#ffd700"],
    "Ocean": ["#00f5ff", "#0088ff", "#3a86ff", "#8338ec", "#1a1a2e", "#00ff88"],
    "Void": ["#1a1a2e", "#2d2d44", "#4a4a6a", "#8338ec", "#ff00ff", "#00f5ff"],
    "Nature": ["#00ff88", "#00cc66", "#2e8b57", "#228b22", "#8b4513", "#daa520"],
    "Royal": ["#ffd700", "#daa520", "#b8860b", "#ff006e", "#8338ec", "#ffffff"],
    "Candy": ["#ff006e", "#ffbe0b", "#00ff88", "#3a86ff", "#ff00ff", "#fb5607"],
    "Monochrome": ["#ffffff", "#c0c0c0", "#808080", "#404040", "#1a1a2e", "#000000"],
}

TRAITS = {
    "Palette": (["Cyberpunk", "Magma", "Ocean", "Void", "Nature", "Royal", "Candy", "Monochrome"], [15, 12, 12, 12, 12, 12, 13, 12]),
    "Creature": (["Quadruped", "Biped", "Serpent", "Flying", "Vehicle", "Structure", "Celestial", "Bot", "Aquatic", "Abstract"], [12, 12, 10, 12, 10, 10, 10, 12, 7, 5]),
    "Mood": (["Energetic", "Mysterious", "Chill", "Aggressive", "Dreamy", "Glitchy"], [18, 16, 16, 15, 18, 17]),
    "Element": (["Fire", "Ice", "Electric", "Void", "Nature", "Plasma", "Crystal", "Toxic"], [13, 13, 13, 12, 12, 13, 12, 12]),
    "Era": (["Ancient", "Cyberpunk", "Steampunk", "Futuristic", "Medieval", "Neon"], [15, 20, 15, 18, 14, 18]),
    "Vibe": (["Cute", "Badass", "Weird", "Elegant", "Brutal", "Ethereal"], [15, 18, 14, 15, 16, 22]),
    "Background": (["Deep Space", "Neon City", "Magma Core", "Crystal Cave", "Void Plain", "Cyber Grid"], [18, 18, 14, 16, 16, 18]),
    "Effect": (["None", "Glow", "Glitch", "Particles", "Hologram", "Shadow"], [20, 20, 15, 15, 15, 15]),
}

ADJECTIVES = ["Neon", "Cyber", "Quantum", "Plasma", "Dark", "Golden", "Toxic", "Crystal", "Void", "Bio", "Steam", "Ice", "Magma", "Spectral", "Retro", "Glitch", "Cosmic", "Shadow", "Solar", "Lunar"]
NOUNS = ["Fox", "Dragon", "Robot", "Shark", "Castle", "Tree", "Phoenix", "Wizard", "Samurai", "Whale", "Golem", "Jellyfish", "Totem", "Cube", "Ship", "Train", "Cat", "Frog", "Butterfly", "Helmet", "Core", "Machine", "Ghost", "Vortex", "Knight", "Mage", "Beast", "Entity", "Construct", "Artifact", "Relic"]

assert sum(RARITY_COUNTS.values()) == MAX_SUPPLY

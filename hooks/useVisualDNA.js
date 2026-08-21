'use client';

import { useMemo } from 'react';
import { createVisualDNA } from '@/lib/assetDNA';

export function useVisualDNA(collectible) {
  return useMemo(() => createVisualDNA({
    seed: collectible?.seed ?? collectible?.id ?? collectible?.name ?? 'voxel',
    family: collectible?.family,
    rarity: collectible?.rarity,
    traits: collectible?.traits,
  }), [collectible?.seed, collectible?.id, collectible?.name, collectible?.family, collectible?.rarity, collectible?.traits]);
}

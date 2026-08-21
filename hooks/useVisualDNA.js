'use client';

import { useMemo } from 'react';
import { generateVisualDNA } from '@/lib/universalCollectible';

export function useVisualDNA(collectible) {
  return useMemo(() => generateVisualDNA(
    collectible?.seed ?? collectible?.id ?? collectible?.name ?? 'voxel',
    collectible?.rarity ?? 'common',
    collectible?.family ?? 'other',
  ), [collectible?.seed, collectible?.id, collectible?.name, collectible?.family, collectible?.rarity]);
}

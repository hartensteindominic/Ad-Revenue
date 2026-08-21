import { generateVisualDNA } from '@/lib/universalCollectible';
import { validateGenerationRequest } from '@/lib/assetGenerationPolicy';

export function buildAssetDirectorRequest(collectible, prompt = '') {
  const visualDNA = collectible?.visualDNA || generateVisualDNA(
    collectible?.seed ?? collectible?.id ?? collectible?.name ?? 'voxel',
    collectible?.rarity ?? 'common',
    collectible?.family ?? 'other',
  );
  const request = {
    seed: collectible?.seed ?? collectible?.id ?? collectible?.name,
    family: collectible?.family ?? 'other',
    rarity: collectible?.rarity ?? 'common',
    subtype: collectible?.subtype ?? null,
    prompt,
    visualDNA,
    sponsored: Boolean(collectible?.sponsorship?.label && collectible.sponsorship.label !== 'none'),
    sponsorDisclosure: collectible?.sponsorship?.disclosureText || null,
  };
  const validation = validateGenerationRequest(request);
  if (!validation.valid) throw new Error(validation.errors.join('; '));
  return request;
}

export function normalizeAIAssetResult(result = {}) {
  return {
    modelUri: result.modelUri || null,
    previewUri: result.previewUri || null,
    thumbnailUri: result.thumbnailUri || null,
    format: result.format === 'gltf' ? 'gltf' : 'glb',
    version: Number.isInteger(result.version) ? Math.max(1, result.version) : 1,
    generationId: result.generationId || null,
  };
}

import { createVisualDNA } from '@/lib/assetDNA';
import { validateGenerationRequest } from '@/lib/assetGenerationPolicy';

export function buildAssetDirectorRequest(collectible, prompt = '') {
  const visualDNA = createVisualDNA(collectible);
  const request = {
    seed: collectible?.seed ?? collectible?.id,
    family: collectible?.family,
    rarity: collectible?.rarity,
    prompt,
    visualDNA,
    sponsored: Boolean(collectible?.sponsorship?.isSponsored),
    sponsorDisclosure: collectible?.sponsorship?.disclosure || null,
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

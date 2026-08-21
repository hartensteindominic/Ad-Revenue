export const AI_ASSET_POLICY = {
  mode: 'assist-not-authority',
  requireDeterministicSeed: true,
  requireVisualDNA: true,
  requireHumanReviewForMint: true,
  preserveSponsoredDisclosure: true,
  maxPromptLength: 4000,
};

export function validateGenerationRequest(request = {}) {
  const errors = [];
  if (AI_ASSET_POLICY.requireDeterministicSeed && !request.seed) errors.push('Generation requires a deterministic seed');
  if (AI_ASSET_POLICY.requireVisualDNA && !request.visualDNA) errors.push('Generation requires visual DNA');
  if (String(request.prompt || '').length > AI_ASSET_POLICY.maxPromptLength) errors.push('Prompt is too long');
  if (request.sponsored && !request.sponsorDisclosure) errors.push('Sponsored assets require disclosure metadata');
  return { valid: errors.length === 0, errors };
}

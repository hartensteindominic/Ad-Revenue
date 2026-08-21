const FORMATS = new Set(['2d', '3d', 'hybrid']);

export function createSponsoredDrop({ id, campaignId, title, sponsor, format = 'hybrid', disclosure = 'Sponsored', artwork = {}, collectible = {}, location = null, revenue = {} } = {}) {
  if (!id || !campaignId) throw new Error('Sponsored drops require id and campaignId');
  if (!FORMATS.has(format)) throw new Error('Unsupported sponsored drop format');
  if (!sponsor?.name) throw new Error('Sponsored drops require sponsor metadata');
  return {
    version: 1,
    id,
    campaignId,
    title: title || 'Vault Drop',
    sponsor: { name: sponsor.name, logoUri: sponsor.logoUri || null },
    disclosure: disclosure || 'Sponsored',
    format,
    artwork: { imageUri: artwork.imageUri || null, animationUri: artwork.animationUri || null, alt: artwork.alt || title || 'Sponsored Vault Drop' },
    collectible: { modelUri: collectible.modelUri || null, previewUri: collectible.previewUri || null, traits: collectible.traits || [] },
    location: location ? { lat: Number(location.lat), lng: Number(location.lng), radiusMeters: Number(location.radiusMeters || 100) } : null,
    revenue: { participantShareBps: Number(revenue.participantShareBps || 0), platformShareBps: Number(revenue.platformShareBps || 0), discoveryPoolBps: Number(revenue.discoveryPoolBps || 0) },
    createdAt: new Date().toISOString(),
  };
}

export function validateRevenueSplit(revenue = {}) {
  const values = ['participantShareBps', 'platformShareBps', 'discoveryPoolBps'].map((key) => Number(revenue[key] || 0));
  return values.every((v) => Number.isInteger(v) && v >= 0) && values.reduce((a, b) => a + b, 0) <= 10000;
}

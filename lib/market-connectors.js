// Voxel Vault commerce routing. Credentials and merchant destinations stay server-side.
export const MARKET_TYPES = { VOXEL: 'voxel', STRIPE: 'stripe', CRYPTO: 'crypto', TEMU: 'temu' };

export function getPhysicalPurchaseConfig(item) {
  const temuAffiliateBase = process.env.NEXT_PUBLIC_TEMU_AFFILIATE_BASE_URL || '';
  const physicalEnabled = process.env.NEXT_PUBLIC_PHYSICAL_MARKET_ENABLED !== 'false';
  const temuEnabled = Boolean(temuAffiliateBase);
  return {
    physicalEnabled,
    nftIncluded: true,
    qrIncluded: true,
    delivery: true,
    temuEnabled,
    temuUrl: temuEnabled ? `${temuAffiliateBase}${temuAffiliateBase.includes('?') ? '&' : '?'}vv_object=${encodeURIComponent(item.id)}` : null,
  };
}

export function getMarketOptions(item) {
  const physical = getPhysicalPurchaseConfig(item);
  return [
    { id: 'physical', label: 'Physical + NFT', enabled: physical.physicalEnabled, href: `/marketplace?asset=${encodeURIComponent(item.id)}&mode=physical` },
    { id: 'digital', label: 'NFT only', enabled: true, href: `/marketplace?asset=${encodeURIComponent(item.id)}&mode=digital` },
    ...(physical.temuEnabled ? [{ id: 'temu', label: 'Shop + NFT', enabled: true, href: physical.temuUrl, external: true }] : []),
  ];
}

import { getNFTWorldCatalog } from '../../../../lib/world/nftWorldCatalog.js';

export async function GET(request) {
  const url = new URL(request.url);
  const family = url.searchParams.get('family') || undefined;
  const rarity = url.searchParams.get('rarity') || undefined;
  const sponsoredParam = url.searchParams.get('sponsored');
  const sponsored = sponsoredParam === null ? undefined : sponsoredParam === 'true';
  const catalog = getNFTWorldCatalog({ family, rarity, sponsored });
  return Response.json({ version: 1, count: catalog.length, sponsoredDisclosure: 'Sponsored collectibles are explicitly disclosed.', catalog }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' } });
}

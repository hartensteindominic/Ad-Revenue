import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function extractImage(html, sourceUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try { return new URL(match[1], sourceUrl).toString(); } catch {}
    }
  }
  return null;
}

export async function GET(request) {
  const sourceUrl = new URL(request.url).searchParams.get('url') || '';
  if (!/^https?:\/\//i.test(sourceUrl)) return NextResponse.json({ error: 'A valid supplier URL is required.' }, { status: 400 });
  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VoxelVaultProductResolver/1.0)' },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ error: 'Supplier listing could not be fetched.' }, { status: 502 });
    const html = await response.text();
    const imageUrl = extractImage(html, sourceUrl);
    if (!imageUrl) return NextResponse.json({ error: 'No public product image was advertised by the supplier listing.' }, { status: 404 });
    return NextResponse.json({ imageUrl, sourceUrl });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Supplier image resolution failed.' }, { status: 500 });
  }
}

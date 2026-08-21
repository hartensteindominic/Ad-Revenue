import { buildWorldDirectorSnapshot } from '../../../../lib/ai/worldDirector.js';
import { getNFTWorldCatalog } from '../../../../lib/world/nftWorldCatalog.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const player = { level: Number(body?.player?.level || 1) };
    const opportunities = getNFTWorldCatalog().slice(0, 24).map((item, index) => ({ ...item, distanceM: Number(body?.opportunities?.[index]?.distanceM ?? 999 + index * 37), freshness: Number(body?.opportunities?.[index]?.freshness ?? ((index % 7) + 1) / 7), activePlayers: Number(body?.opportunities?.[index]?.activePlayers ?? index % 12) }));
    return Response.json(buildWorldDirectorSnapshot({ player, opportunities }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error?.message || 'World director failed' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const configured = Boolean(process.env.VOXEL_AI_ASSET_PROVIDER_URL);
  return NextResponse.json({
    ok: true,
    service: 'voxel-vault-ai',
    providerConfigured: configured,
    mode: configured ? 'live-capable' : 'local-planner',
    timestamp: new Date().toISOString(),
  }, { headers: { 'cache-control': 'no-store' } });
}

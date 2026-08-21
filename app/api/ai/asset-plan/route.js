import { NextResponse } from 'next/server';
import { createAssetPlan, buildProviderPayload } from '@/lib/ai/assetPlanner';
import { buildAssetDirectorRequest } from '@/lib/ai/assetDirector';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const seed = String(body.seed || body.id || '').trim();
    if (!seed) return NextResponse.json({ error: 'seed is required' }, { status: 400 });

    const plan = createAssetPlan({
      seed,
      family: body.family || 'other',
      rarity: body.rarity || 'common',
      subtype: body.subtype || null,
      creativeDirection: body.creativeDirection || body.prompt || '',
    });

    const directorRequest = buildAssetDirectorRequest({
      seed,
      family: plan.family,
      rarity: plan.rarity,
      subtype: plan.subtype,
      visualDNA: plan.visualDNA,
      sponsorship: body.sponsorship,
    }, plan.creativeDirection);

    return NextResponse.json({
      ok: true,
      plan,
      providerPayload: buildProviderPayload(plan),
      directorRequest,
      providerConfigured: Boolean(process.env.VOXEL_AI_ASSET_PROVIDER_URL),
      status: process.env.VOXEL_AI_ASSET_PROVIDER_URL ? 'plan-ready-for-provider' : 'plan-ready-local',
    });
  } catch (error) {
    console.error('asset plan failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to create asset plan' }, { status: 400 });
  }
}

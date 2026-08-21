import { NextResponse } from 'next/server';
import { createAssetPlan, buildProviderPayload } from '@/lib/ai/assetPlanner';
import { buildAssetDirectorRequest } from '@/lib/ai/assetDirector';
import { enforceAssetQuality } from '@/lib/ai/qualityGate';
import { buildSafeAIContext } from '@/lib/ai/promptGuard';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const context = buildSafeAIContext({
      seed: String(body.seed || body.id || '').trim(),
      family: body.family,
      rarity: body.rarity,
      subtype: body.subtype,
      creativeDirection: body.creativeDirection || body.prompt || '',
    });
    const plan = enforceAssetQuality(createAssetPlan(context));
    const directorRequest = buildAssetDirectorRequest({
      seed: context.seed,
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

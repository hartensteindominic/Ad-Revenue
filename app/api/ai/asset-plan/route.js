import { NextResponse } from 'next/server';
import { createAssetPlan, buildProviderPayload } from '@/lib/ai/assetPlanner';
import { buildAssetDirectorRequest } from '@/lib/ai/assetDirector';
import { enforceAssetQuality } from '@/lib/ai/qualityGate';
import { buildSafeAIContext } from '@/lib/ai/promptGuard';
import { runLiveAssetProvider } from '@/lib/ai/liveProvider';
import { normalizeAIAssetResult } from '@/lib/ai/assetResult';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const context = buildSafeAIContext({ seed: String(body.seed || body.id || '').trim(), family: body.family, rarity: body.rarity, subtype: body.subtype, creativeDirection: body.creativeDirection || body.prompt || '' });
    const plan = enforceAssetQuality(createAssetPlan(context));
    const providerPayload = buildProviderPayload(plan);
    const directorRequest = buildAssetDirectorRequest({ seed: context.seed, family: plan.family, rarity: plan.rarity, subtype: plan.subtype, visualDNA: plan.visualDNA, sponsorship: body.sponsorship }, plan.creativeDirection);
    const live = body.live === true ? await runLiveAssetProvider(providerPayload) : { configured: Boolean(process.env.VOXEL_AI_ASSET_PROVIDER_URL), result: null, reason: 'live-not-requested' };
    const asset = live.result ? normalizeAIAssetResult(live.result) : null;
    return NextResponse.json({ ok: true, plan, providerPayload, directorRequest, ai: { mode: asset ? 'live' : 'local-planner', providerConfigured: live.configured, asset, rawResult: asset ? undefined : live.result, reason: live.reason || null }, status: asset ? 'live-ai-complete' : 'plan-ready-local' });
  } catch (error) {
    console.error('asset plan failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to create asset plan' }, { status: 400 });
  }
}

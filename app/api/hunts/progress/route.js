import { NextResponse } from 'next/server';
import { completeStop, markRewardMinted, getProgress, getHunt } from '../../../../lib/huntProgressStore';
import { evaluateHuntProgress } from '../../../../lib/scavengerHunt';

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'complete_stop';

    if (action === 'complete_stop') {
      const result = completeStop({
        huntId: body.huntId,
        wallet: body.walletAddress,
        stopId: body.stopId,
        claimTicket: body.claimTicket,
      });
      return NextResponse.json({
        ...result,
        message: result.rewardUnlocked
          ? 'Hunt complete! Mint your reward NFT on Ethereum (ETH gas).'
          : 'Stop cleared. Keep hunting.',
      });
    }

    if (action === 'mark_reward_minted') {
      if (!body.txHash) {
        return NextResponse.json({ error: 'txHash required' }, { status: 400 });
      }
      const progress = markRewardMinted(body.huntId, body.walletAddress, body.txHash);
      return NextResponse.json({ progress, ownershipGranted: true });
    }

    if (action === 'status') {
      const hunt = getHunt(body.huntId);
      if (!hunt) return NextResponse.json({ error: 'Hunt not found' }, { status: 404 });
      const progress = getProgress(body.huntId, body.walletAddress);
      return NextResponse.json({
        progress,
        evaluation: evaluateHuntProgress(hunt, progress.completedStopIds),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const status =
      error?.code === 'out_of_order' || error?.code === 'already_completed' ? 409 : 400;
    return NextResponse.json({ error: error?.message || 'Progress update failed' }, { status });
  }
}

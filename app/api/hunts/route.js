import { NextResponse } from 'next/server';
import { listHunts, getHunt, getProgress } from '../../../lib/huntProgressStore';
import { evaluateHuntProgress, isHuntActive } from '../../../lib/scavengerHunt';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const wallet = searchParams.get('wallet');

    if (id) {
      const hunt = getHunt(id);
      if (!hunt) return NextResponse.json({ error: 'Hunt not found' }, { status: 404 });
      let progress = null;
      let evaluation = null;
      if (wallet) {
        progress = getProgress(id, wallet);
        evaluation = evaluateHuntProgress(hunt, progress.completedStopIds);
      }
      return NextResponse.json({
        hunt,
        active: isHuntActive(hunt),
        progress,
        evaluation,
      });
    }

    const hunts = listHunts().map((h) => ({
      ...h,
      active: isHuntActive(h),
      stopCount: h.stops?.length || 0,
    }));
    return NextResponse.json({ hunts });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Failed to list hunts' }, { status: 500 });
  }
}

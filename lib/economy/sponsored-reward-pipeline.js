export function buildSponsoredReward({ campaign, verifiedEvent, user }) {
  if (!campaign?.id || !verifiedEvent?.id || !user?.id) throw new Error('campaign, verifiedEvent, and user are required');
  if (campaign.status !== 'active') throw new Error('campaign is not active');

  const budget = Math.max(0, Number(campaign.rewardBudget) || 0);
  const userShare = Math.min(0.25, Math.max(0, Number(campaign.userShare) || 0));
  const platformShare = Math.min(0.2, Math.max(0, Number(campaign.platformShare) || 0.1));
  const sponsorShare = Math.min(1 - userShare - platformShare, Math.max(0, Number(campaign.sponsorShare) || 0));
  const distributable = Math.max(0, budget * (1 - platformShare));

  return {
    campaignId: campaign.id,
    eventId: verifiedEvent.id,
    userId: user.id,
    disclosure: 'Sponsored reward',
    status: 'pending-settlement',
    allocation: {
      user: Number((distributable * userShare).toFixed(6)),
      sponsor: Number((distributable * sponsorShare).toFixed(6)),
      platform: Number((budget * platformShare).toFixed(6)),
      currency: campaign.currency || 'USD',
    },
    mintMode: 'lazy-or-sponsored',
  };
}

const finite = (value, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function analyzeVaultEvents(events = []) {
  const claims = events.filter((event) => event?.type === 'claim');
  const settlements = events.filter((event) => event?.type === 'settlement');
  const failures = events.filter((event) => event?.type === 'error' || event?.type === 'failed');
  const uniqueWallets = new Set(claims.map((event) => event.wallet).filter(Boolean));
  const totalValue = settlements.reduce((sum, event) => sum + finite(event.valueEth), 0);
  const failureRate = events.length ? failures.length / events.length : 0;
  const insights = [];

  if (claims.length) insights.push({
    id: 'claim-activity', kind: 'trend', title: 'Claim activity detected',
    summary: `${claims.length} claim event${claims.length === 1 ? '' : 's'} across ${uniqueWallets.size} wallet${uniqueWallets.size === 1 ? '' : 's'}.`,
    priority: claims.length >= 20 ? 'high' : 'low', evidence: { claims: claims.length, wallets: uniqueWallets.size },
  });
  if (settlements.length) insights.push({
    id: 'settlement-value', kind: 'product', title: 'On-chain settlement activity',
    summary: `${settlements.length} settlement${settlements.length === 1 ? '' : 's'} confirmed for ${totalValue.toFixed(4)} ETH of recorded value.`,
    priority: 'medium', evidence: { settlements: settlements.length, valueEth: totalValue.toFixed(4) },
  });
  if (failureRate > 0.05) insights.push({
    id: 'error-rate', kind: 'quality', title: 'Quality signal needs attention',
    summary: `${Math.round(failureRate * 100)}% of supplied events are failures.`,
    priority: failureRate > 0.2 ? 'high' : 'medium', evidence: { failures: failures.length, events: events.length, failureRate: failureRate.toFixed(3) },
  });

  const repeatedDrops = new Map();
  for (const claim of claims) if (claim.dropId) repeatedDrops.set(claim.dropId, (repeatedDrops.get(claim.dropId) || 0) + 1);
  const hottest = [...repeatedDrops.entries()].sort((a, b) => b[1] - a[1])[0];
  if (hottest && hottest[1] >= 3) insights.push({
    id: 'hot-drop', kind: 'trend', title: 'High-demand drop',
    summary: `Drop ${hottest[0]} is receiving concentrated claim activity.`,
    priority: hottest[1] >= 10 ? 'high' : 'medium', evidence: { dropId: hottest[0], claims: hottest[1] },
  });
  return insights;
}

export function buildAutopilotPlan(insights = []) {
  return insights.map((insight) => ({
    insightId: insight.id,
    action: insight.kind === 'quality' ? 'open_quality_task' : 'refresh_dashboard_signal',
    autonomous: true,
    requiresHumanApproval: insight.kind !== 'quality',
  }));
}

const MAX_ITEMS = 80;
const MAX_STRING = 240;

function cleanString(value, fallback = '') {
  return String(value ?? fallback).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, MAX_STRING);
}

function cleanNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function buildVaultSnapshot(input = {}) {
  const rawItems = Array.isArray(input.items) ? input.items : [];
  const rawEvents = Array.isArray(input.events) ? input.events : [];

  const items = rawItems.slice(0, MAX_ITEMS).map((item, index) => ({
    id: cleanString(item?.id, `item-${index + 1}`),
    name: cleanString(item?.name, 'Unnamed object'),
    family: cleanString(item?.family, 'unknown'),
    rarity: cleanString(item?.rarity, 'unknown'),
    creator: cleanString(item?.creator, 'unknown'),
    priceEth: cleanNumber(item?.priceEth, 0),
    owned: Boolean(item?.owned),
    favorited: Boolean(item?.favorited),
  }));

  const events = rawEvents.slice(-MAX_ITEMS).map((event) => ({
    type: cleanString(event?.type, 'unknown'),
    itemId: cleanString(event?.itemId, ''),
    timestamp: cleanString(event?.timestamp, ''),
    valueEth: cleanNumber(event?.valueEth, 0),
  }));

  const owned = items.filter((item) => item.owned).length;
  const favorites = items.filter((item) => item.favorited).length;
  const totalListedEth = items.reduce((sum, item) => sum + (item.priceEth > 0 ? item.priceEth : 0), 0);
  const eventCounts = events.reduce((counts, event) => {
    counts[event.type] = (counts[event.type] || 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    counts: { items: items.length, owned, favorites, events: events.length },
    totalListedEth: Number(totalListedEth.toFixed(6)),
    eventCounts,
    items,
    events,
  };
}

export function buildProactivePrompt(snapshot) {
  return [
    'Review the Voxel Vault snapshot below as a product copilot.',
    'Return exactly three short sections: SIGNAL, NEXT MOVE, WATCH.',
    'Only use facts present in the snapshot. If data is sparse, say so.',
    'Do not invent blockchain state, prices, users, locations, ownership, or transactions.',
    'You may recommend actions, but never claim to have executed a wallet, payment, mint, listing, transfer, or account action.',
    JSON.stringify(snapshot),
  ].join('\n\n');
}

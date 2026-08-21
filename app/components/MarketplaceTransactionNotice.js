'use client';

import React from 'react';

export default function MarketplaceTransactionNotice({ state = 'idle', mode = 'eth' }) {
  const copy = {
    idle: mode === 'eth' ? 'Your wallet will confirm the purchase. Ownership updates after the blockchain confirms.' : 'Card payment is processed separately. On-chain ownership updates only after fulfillment is confirmed.',
    pending: 'Waiting for your wallet or payment provider. Do not close this window yet.',
    submitted: 'Transaction submitted. Voxel Vault is waiting for blockchain confirmation.',
    confirmed: 'Confirmed. Ownership can now be refreshed from the blockchain.',
    failed: 'Nothing was marked as purchased. The transaction did not complete.'
  }[state] || 'Transaction state unavailable.';

  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs text-white/60">
      <div className="font-semibold text-white/80">{state === 'confirmed' ? 'Purchase confirmed' : state === 'failed' ? 'Purchase not completed' : 'Purchase status'}</div>
      <p className="mt-1 leading-5">{copy}</p>
    </div>
  );
}

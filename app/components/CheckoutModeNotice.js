'use client';

import React from 'react';

export default function CheckoutModeNotice({ mode = 'eth', live = false }) {
  const isEth = mode === 'eth';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs text-white/60">
      <div className="font-semibold text-white/80">{isEth ? 'Pay with ETH' : 'Pay with card'}</div>
      <p className="mt-1 leading-5">
        {isEth
          ? live ? 'Your wallet will approve a real blockchain transaction. Ownership changes only after confirmation.' : 'ETH checkout is currently in demo mode until the marketplace contract is connected.'
          : live ? 'Card payment is processed separately. Voxel Vault will show on-chain ownership only after the fulfillment transaction is confirmed.' : 'Card checkout is currently in demo mode.'}
      </p>
      {!live && <span className="mt-2 inline-flex rounded-full border border-amber-300/20 bg-amber-300/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.15em] text-amber-200/70">DEMO</span>}
    </div>
  );
}

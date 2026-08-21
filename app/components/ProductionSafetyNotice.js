'use client';

import React from 'react';

export default function ProductionSafetyNotice({ contractsConfigured = false, networkReady = false }) {
  const ready = contractsConfigured && networkReady;
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-xs text-white/55">
      <div className="flex items-center gap-2 font-semibold text-white/75">
        <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-amber-300'}`} />
        {ready ? 'Blockchain ready' : 'Blockchain setup incomplete'}
      </div>
      <p className="mt-1 leading-5">
        {ready
          ? 'Live blockchain actions may be offered. The app should still wait for transaction confirmation before changing ownership state.'
          : 'Blockchain actions remain clearly gated until contracts and the expected network are configured.'}
      </p>
    </div>
  );
}

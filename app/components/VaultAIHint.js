'use client';

import React from 'react';

export default function VaultAIHint({ text = 'You might like this one.', onExplore }) {
  return (
    <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm" aria-hidden="true">✦</span>
        <p className="truncate text-xs text-white/70">{text}</p>
      </div>
      {onExplore && <button type="button" onClick={onExplore} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white/65">Explore</button>}
    </div>
  );
}

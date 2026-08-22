'use client';

import React from 'react';

export default function NFT3DStage({ children, title = '3D NFT', status = 'LIVE DIGITAL TWIN', family, rarity }) {
  return (
    <section className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,.22),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,.08),transparent_45%),linear-gradient(145deg,#0b0d18,#03040a)] shadow-[0_30px_90px_rgba(0,0,0,.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <header className="relative flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
            {status}
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white sm:text-base">{title}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-[8px] font-bold uppercase tracking-[.14em] text-white/40">
            {family && <span>{family}</span>}
            {rarity && <span>• {rarity}</span>}
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-violet-200/20 bg-violet-200/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.18em] text-violet-100 shadow-[0_0_24px_rgba(139,92,246,.15)]">3D NFT</div>
      </header>
      <div className="relative min-h-[330px] px-2 pb-2 pt-1 sm:min-h-[390px] sm:px-3">
        <div className="absolute inset-x-10 bottom-8 h-16 rounded-[50%] bg-black/60 blur-2xl" />
        <div className="relative h-full min-h-[330px] sm:min-h-[390px]">{children}</div>
      </div>
      <footer className="relative grid grid-cols-2 border-t border-white/10 bg-black/15 text-[8px] font-black uppercase tracking-[.15em] text-white/45 sm:text-[9px]">
        <div className="px-4 py-3 sm:px-5">Interactive digital collectible</div>
        <div className="border-l border-white/10 px-4 py-3 text-right text-violet-200/70 sm:px-5">Physical + NFT</div>
      </footer>
    </section>
  );
}

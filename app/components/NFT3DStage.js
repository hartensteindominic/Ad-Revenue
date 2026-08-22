'use client';

import React from 'react';

export default function NFT3DStage({ children, title = '3D NFT', status = 'LIVE DIGITAL TWIN' }) {
  return (
    <section className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,.18),transparent_42%),linear-gradient(145deg,#0b0d18,#03040a)] shadow-[0_30px_90px_rgba(0,0,0,.42)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      <div className="relative flex items-center justify-between px-4 pt-4 sm:px-5">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.24em] text-violet-300">{status}</div>
          <div className="mt-1 text-sm font-semibold text-white">{title}</div>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.18em] text-emerald-200">NFT</div>
      </div>
      <div className="relative px-2 pb-2 pt-1 sm:px-3">{children}</div>
      <div className="relative flex items-center justify-between border-t border-white/10 px-4 py-3 text-[9px] font-bold uppercase tracking-[.16em] text-white/40 sm:px-5">
        <span>Interactive digital collectible</span>
        <span>Physical + NFT</span>
      </div>
    </section>
  );
}

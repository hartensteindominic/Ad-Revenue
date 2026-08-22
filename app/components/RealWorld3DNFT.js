'use client';

import dynamic from 'next/dynamic';

const Product3DTwin = dynamic(() => import('./Product3DTwin'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-white/10 bg-black/30 text-xs font-semibold uppercase tracking-[.16em] text-white/55">
      Loading digital twin…
    </div>
  ),
});

export default function RealWorld3DNFT({ item, hero = false }) {
  const price = item?.customerPriceUsd ? `$${item.customerPriceUsd}` : null;

  return (
    <div className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''} relative overflow-hidden`}>
      <div className="vv3-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
        <div className="rounded-full border border-cyan-300/25 bg-black/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.08)] backdrop-blur-xl">
          <span aria-hidden="true">◆</span> 3D NFT
        </div>
        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.13em] text-white/85 backdrop-blur-xl">
          NFT INCLUDED
        </div>
      </div>
      <Product3DTwin item={item} hero={hero} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 to-transparent" />
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/65">REAL-WORLD DIGITAL TWIN</div>
          <div className="mt-1 truncate text-xs font-bold text-white">{item?.name || 'Collectible object'}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-100/80">PHYSICAL + NFT</div>
          {price && <div className="mt-1 text-sm font-black text-white">{price}</div>}
        </div>
      </div>
    </div>
  );
}

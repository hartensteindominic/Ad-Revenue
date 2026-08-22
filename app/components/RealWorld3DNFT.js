'use client';

import dynamic from 'next/dynamic';

const Product3DTwin = dynamic(() => import('./Product3DTwin'), { ssr: false });

export default function RealWorld3DNFT({ item, hero = false }) {
  const price = item?.customerPriceUsd ? `$${item.customerPriceUsd}` : null;
  return (
    <div className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''}`}>
      <div className="vv3-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
        <div className="rounded-full border border-violet-300/30 bg-black/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-violet-100 backdrop-blur-md">
          <span aria-hidden="true">◆</span> 3D NFT
        </div>
        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.13em] text-white/80 backdrop-blur-md">
          NFT INCLUDED
        </div>
      </div>
      <Product3DTwin item={item} hero={hero} />
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/55">REAL-WORLD DIGITAL TWIN</div>
          <div className="mt-1 text-xs font-bold text-white/90">{item?.name || 'Collectible object'}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/80">PHYSICAL + NFT</div>
          {price && <div className="mt-1 text-sm font-black text-white">{price}</div>}
        </div>
      </div>
    </div>
  );
}

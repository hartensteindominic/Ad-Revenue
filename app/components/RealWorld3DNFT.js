'use client';

import dynamic from 'next/dynamic';

const CanonicalNFTMedia = dynamic(() => import('./CanonicalNFTMedia'), { ssr: false });

export default function RealWorld3DNFT({ item, hero = false }) {
  return (
    <div className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''}`}>
      <div className="vv3-grid" aria-hidden="true" />
      <CanonicalNFTMedia item={item} interactive className="relative z-[1] h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-violet-300/25 bg-black/55 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-violet-100 backdrop-blur-md">
        <span aria-hidden="true">◆</span> 3D NFT TWIN
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[.14em] text-white/60">
        <span>{item.modelUri ? 'VERIFIED 3D ASSET' : 'DIGITAL TWIN'}</span>
        <span>REAL-WORLD OBJECT</span>
      </div>
    </div>
  );
}

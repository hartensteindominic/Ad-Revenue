'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false, loading: () => <StageSkeleton /> });

function StageSkeleton() {
  return (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-[32px] border border-white/10 bg-white/[.025]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-20 w-20 animate-pulse rounded-full border border-white/10 bg-white/5" />
        <p className="text-[10px] uppercase tracking-[.24em] text-white/35">Preparing your collectible</p>
      </div>
    </div>
  );
}

export default function Fast3DStage({ assetUrl, previewProps = {}, viewerProps = {} }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div className="absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-[#070912]/80 p-2 shadow-[0_24px_100px_rgba(0,0,0,.38)] sm:min-h-[480px]">
        {!ready ? <ArtPreview {...previewProps} /> : <Safe3DViewer assetUrl={assetUrl} previewProps={previewProps} {...viewerProps} />}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.2em] text-white/45 backdrop-blur-md">Drag · Rotate · Explore</span>
      </div>
    </div>
  );
}

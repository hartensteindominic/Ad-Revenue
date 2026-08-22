'use client';

import React, { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

function ViewerSkeleton() {
  return (
    <div role="status" aria-label="Loading 3D object" className="flex aspect-[4/3] min-h-[240px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#05060c]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full border border-white/15 bg-white/[.04]" />
        <span className="text-xs uppercase tracking-[.2em] text-white/40">Loading 3D…</span>
      </div>
    </div>
  );
}

function ProductImageFallback({ imageUrl, alt = 'Real-world object', compact = false }) {
  return (
    <div role="img" aria-label={`${alt} product image`} className="relative h-full min-h-[240px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#05060c]">
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5 pt-14">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">3D reference unavailable</div>
        <div className="mt-1 text-xs text-white/65">Showing the real-world source image instead.</div>
      </div>
      {!imageUrl ? <div className="absolute inset-0 grid place-items-center text-sm text-white/50">Product image unavailable</div> : null}
    </div>
  );
}

class ViewerBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <ProductImageFallback {...this.props.previewProps} />;
    return this.props.children;
  }
}

export default function Safe3DViewer({ assetUrl, previewProps = {}, compact = false, ...props }) {
  const [webgl, setWebgl] = useState(null);
  const [assetFailed, setAssetFailed] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebgl(Boolean(gl));
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    if (!assetUrl || typeof document === 'undefined') return undefined;
    let link;
    try {
      link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = assetUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch {
      link = null;
    }
    return () => {
      if (link?.parentNode) link.parentNode.removeChild(link);
    };
  }, [assetUrl]);

  if (webgl === false || assetFailed || !assetUrl) {
    return <ProductImageFallback {...previewProps} compact={compact} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[760px] items-center justify-center overflow-hidden rounded-3xl touch-none" style={{ aspectRatio: '4 / 3', minHeight: compact ? 220 : 240 }} onContextMenu={(e) => e.preventDefault()}>
      <div className="flex h-full w-full items-center justify-center [&>div]:h-full [&>div]:w-full">
        <ViewerBoundary previewProps={previewProps}>
          <VoxelViewer {...props} assetUrl={assetUrl} onError={() => setAssetFailed(true)} />
        </ViewerBoundary>
      </div>
    </div>
  );
}

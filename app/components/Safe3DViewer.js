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

function ProductImageFallback({ imageUrl, alt = 'Real-world object' }) {
  return (
    <div role="img" aria-label={`${alt} product image`} className="relative h-full min-h-[240px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#05060c]">
      {imageUrl ? <img src={imageUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : null}
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
    return this.state.failed ? <ProductImageFallback {...this.props.previewProps} /> : this.props.children;
  }
}

export default function Safe3DViewer({ assetUrl, previewProps = {}, compact = false, ...props }) {
  const [webgl, setWebgl] = useState(null);
  const [assetFailed, setAssetFailed] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const isEmbed = typeof assetUrl === 'string' && assetUrl.includes('sketchfab.com/models/') && assetUrl.includes('/embed');

  useEffect(() => {
    setAssetFailed(false);
    setEmbedLoaded(false);
    if (isEmbed) {
      setWebgl(true);
      return;
    }
    try {
      const c = document.createElement('canvas');
      setWebgl(Boolean(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
  }, [isEmbed, assetUrl]);

  // Do not preload remote GLB data. A corporate proxy should never be able
  // to stall the page merely because a 3D asset host is blocked or slow.
  if (isEmbed) {
    if (assetFailed) return <ProductImageFallback {...previewProps} />;
    return (
      <div className="relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-3xl touch-none" style={{ aspectRatio: '4 / 3', minHeight: compact ? 220 : 240 }}>
        {!embedLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[#05060c]">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full border border-white/15 bg-white/[.04]" />
              <span className="text-xs uppercase tracking-[.2em] text-white/40">Preparing 3D reference…</span>
            </div>
          </div>
        )}
        <iframe
          title={`${previewProps.alt || 'Real-world object'} 3D model`}
          src={assetUrl}
          className="h-full w-full min-h-[240px] border-0"
          loading="lazy"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setEmbedLoaded(true)}
          onError={() => setAssetFailed(true)}
        />
      </div>
    );
  }

  if (webgl === false || assetFailed || !assetUrl) return <ProductImageFallback {...previewProps} />;

  return (
    <div className="mx-auto flex w-full max-w-[760px] items-center justify-center overflow-hidden rounded-3xl touch-none" style={{ aspectRatio: '4 / 3', minHeight: compact ? 220 : 240 }}>
      <div className="flex h-full w-full items-center justify-center [&>div]:h-full [&>div]:w-full">
        <ViewerBoundary previewProps={previewProps}>
          <VoxelViewer {...props} assetUrl={assetUrl} onError={() => setAssetFailed(true)} />
        </ViewerBoundary>
      </div>
    </div>
  );
}

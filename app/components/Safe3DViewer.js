'use client';

import React, { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

function ViewerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading 3D collectible"
      className="flex aspect-[4/3] min-h-[240px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#05060c]"
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full border border-white/15 bg-white/[.04]" />
        <span className="text-xs uppercase tracking-[.2em] text-white/40">Loading 3D…</span>
      </div>
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
    if (this.state.failed) return <ArtPreview {...this.props.previewProps} />;
    return this.props.children;
  }
}

export default function Safe3DViewer({ assetUrl, previewProps = {}, ...props }) {
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

  // Warm the browser cache before Three.js asks for the GLB. This makes repeat
  // visits noticeably faster without downloading the asset twice when cached.
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

  if (webgl === false) return <ArtPreview {...previewProps} />;
  if (assetFailed) return <ArtPreview {...previewProps} />;

  return (
    <div
      className="mx-auto flex w-full max-w-[760px] items-center justify-center overflow-hidden rounded-3xl touch-none"
      style={{ aspectRatio: '4 / 3', minHeight: 240 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex h-full w-full items-center justify-center [&>div]:h-full [&>div]:w-full">
        <ViewerBoundary previewProps={previewProps}>
          <VoxelViewer {...props} assetUrl={assetUrl} onError={() => setAssetFailed(true)} />
        </ViewerBoundary>
      </div>
    </div>
  );
}

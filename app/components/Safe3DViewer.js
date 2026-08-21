'use client';

import React, { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false, loading: () => <ViewerSkeleton /> });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

function ViewerSkeleton() {
  return <div role="status" aria-label="Loading 3D collectible" className="flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-white/[.03]"><span className="text-xs uppercase tracking-[.2em] text-white/40">Loading 3D…</span></div>;
}

class ViewerBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
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
    } catch { setWebgl(false); }
  }, []);

  if (webgl === false) return <ArtPreview {...previewProps} />;
  if (assetFailed) return <ArtPreview {...previewProps} />;

  return (
    <div className="touch-none overflow-hidden rounded-3xl" onContextMenu={(e) => e.preventDefault()}>
      <ViewerBoundary previewProps={previewProps}>
        <VoxelViewer {...props} assetUrl={assetUrl} onError={() => setAssetFailed(true)} />
      </ViewerBoundary>
    </div>
  );
}

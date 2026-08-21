'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false });

export default function AIAssetMediaStage({ asset, previewProps = {}, viewerProps = {} }) {
  const modelUrl = asset?.modelUri || null;
  const previewUrl = asset?.previewUri || null;

  if (modelUrl) {
    return <Safe3DViewer assetUrl={modelUrl} previewProps={{ ...previewProps, imageUrl: previewUrl || previewProps.imageUrl }} {...viewerProps} />;
  }

  if (previewUrl) {
    return (
      <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#05060c] p-6">
        <img src={previewUrl} alt={asset?.title || previewProps.alt || 'AI generated collectible'} className="block max-h-[520px] max-w-full object-contain object-center" loading="eager" decoding="async" />
      </div>
    );
  }

  return <Safe3DViewer assetUrl={null} previewProps={previewProps} {...viewerProps} />;
}

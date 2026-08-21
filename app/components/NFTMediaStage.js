'use client';

import dynamic from 'next/dynamic';
import { resolveNFTMedia } from '@/lib/resolveNFTMedia';

const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false });

export default function NFTMediaStage({ item, previewProps = {}, viewerProps = {}, className = '' }) {
  const media = resolveNFTMedia(item);
  if (media.modelUri) {
    return <div className={`flex min-h-[280px] w-full items-center justify-center overflow-hidden ${className}`}>
      <Safe3DViewer assetUrl={media.modelUri} previewProps={previewProps} {...viewerProps} />
    </div>;
  }
  if (media.imageUri) {
    return <div className={`flex min-h-[280px] w-full items-center justify-center overflow-hidden ${className}`}>
      <img src={media.imageUri} alt={item?.name || 'NFT artwork'} loading="eager" decoding="async" className="block max-h-full max-w-full object-contain object-center" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
    </div>;
  }
  return null;
}

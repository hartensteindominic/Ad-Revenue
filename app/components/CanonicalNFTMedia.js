'use client';

import dynamic from 'next/dynamic';
import { resolveNFTMedia } from '../../lib/media/assetResolver';

const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

export default function CanonicalNFTMedia({ item, interactive = false, className = '' }) {
  const media = resolveNFTMedia(item);
  const previewProps = { family: item.family, material: item.material, seed: item.seed, rarity: item.rarity, interactive, showcase: !interactive, compact: !interactive, label: false };

  return (
    <div className={`flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden ${className}`}>
      {media.modelUri ? (
        <Safe3DViewer assetUrl={media.modelUri} previewProps={previewProps} interactive={interactive} shape={item.shape} family={item.family} material={item.material} rarity={item.rarity} seed={item.seed} />
      ) : media.previewUri ? (
        <img src={media.previewUri} alt={item.name || 'Voxel Vault collectible'} className="block max-h-full max-w-full object-contain object-center" loading="eager" decoding="async" />
      ) : (
        <ArtPreview {...previewProps} />
      )}
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { resolveNFTMedia } from '../../lib/media/assetResolver';

const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const NFT3DStage = dynamic(() => import('./NFT3DStage'), { ssr: false });

export default function CanonicalNFTMedia({ item, interactive = false, className = '' }) {
  const media = resolveNFTMedia(item);
  const previewProps = {
    family: item?.family,
    material: item?.material,
    seed: item?.seed,
    rarity: item?.rarity,
    shape: item?.shape,
    interactive,
    showcase: true,
    compact: false,
    label: false,
  };

  return (
    <NFT3DStage
      title={item?.name || 'Digital Twin'}
      status={media.modelUri ? 'VERIFIED 3D ASSET' : 'LIVE DIGITAL TWIN'}
      family={item?.family}
      rarity={item?.rarity}
    >
      <div className={`relative flex min-h-[320px] items-center justify-center ${className}`}>
        {media.modelUri ? (
          <Safe3DViewer
            assetUrl={media.modelUri}
            previewProps={{ ...previewProps, imageUrl: media.previewUri || undefined, alt: item?.name || 'Real-world object' }}
            interactive={interactive}
            shape={item?.shape}
            family={item?.family}
            material={item?.material}
            rarity={item?.rarity}
            seed={item?.seed}
          />
        ) : (
          <ArtPreview {...previewProps} />
        )}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.18em] text-white/60 backdrop-blur-md">
          3D collectible · NFT
        </div>
      </div>
    </NFT3DStage>
  );
}

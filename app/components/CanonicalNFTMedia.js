'use client';

import dynamic from 'next/dynamic';
import { resolveNFTMedia } from '../../lib/media/assetResolver';

const Safe3DViewer = dynamic(() => import('./Safe3DViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

export default function CanonicalNFTMedia({ item, interactive = false, className = '', fallback = null }) {
  const media = resolveNFTMedia(item);
  const previewProps = {
    family: item?.family,
    material: item?.material,
    seed: item?.seed,
    rarity: item?.rarity,
    shape: item?.shape,
    interactive,
    showcase: !interactive,
    compact: !interactive,
    label: false,
  };

  // A canonical collectible is always presented as a 3D NFT. A verified/licensed
  // model takes priority; otherwise ArtPreview supplies the deterministic digital twin.
  if (media.modelUri) {
    return (
      <div className={`flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden ${className}`}>
        <Safe3DViewer
          assetUrl={media.modelUri}
          previewProps={{ ...previewProps, imageUrl: media.previewUri || undefined }}
          interactive={interactive}
          shape={item?.shape}
          family={item?.family}
          material={item?.material}
          rarity={item?.rarity}
          seed={item?.seed}
        />
      </div>
    );
  }

  return (
    <div className={`relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden ${className}`}>
      <ArtPreview {...previewProps} />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-violet-300/20 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-violet-200 backdrop-blur-md">
        3D NFT Twin
      </div>
    </div>
  );
}

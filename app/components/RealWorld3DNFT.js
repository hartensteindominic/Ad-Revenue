'use client';

import dynamic from 'next/dynamic';

const Product3DTwin = dynamic(() => import('./Product3DTwin'), {
  ssr: false,
  loading: () => <div role="img" aria-label="Loading 3D NFT digital twin" className="vv3-twinLoading">LOADING 3D TWIN</div>,
});

export default function RealWorld3DNFT({ item, hero = false }) {
  const price = item?.customerPriceUsd ? `$${item.customerPriceUsd}` : null;
  const preview = item?.previewUri;
  const titleId = `twin-${item?.id || 'object'}`;

  return (
    <figure className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''}`} aria-labelledby={titleId}>
      <div className="vv3-grid" aria-hidden="true" />
      <div className="vv3-twinHeader">
        <span className="vv3-twinPill"><span aria-hidden="true">◆</span> 3D NFT INCLUDED</span>
        <span className="vv3-twinSource">REAL-WORLD DIGITAL TWIN</span>
      </div>
      <div className="vv3-twinStageMeta" aria-hidden="true">
        <span className="vv3-twinLive"><i /> LIVE 3D</span>
        <span>DRAG · ORBIT · ZOOM</span>
      </div>
      {preview && (
        <div className="vv3-referenceThumb">
          <img src={preview} alt="" loading={hero ? 'eager' : 'lazy'} decoding="async" />
          <span>PHYSICAL REFERENCE</span>
        </div>
      )}
      <Product3DTwin item={item} hero={hero} />
      <figcaption className="vv3-twinFooter" id={titleId}>
        <div className="vv3-twinName"><small>{item?.creator || 'Voxel Vault'}</small><strong>{item?.name || 'Collectible object'}</strong></div>
        <div className="vv3-twinPrice"><small>PHYSICAL + DIGITAL</small>{price && <strong>{price}</strong>}</div>
      </figcaption>
    </figure>
  );
}

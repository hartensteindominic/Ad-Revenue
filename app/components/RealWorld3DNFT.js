'use client';

import dynamic from 'next/dynamic';
import './vv3-nft.css';

const Product3DTwin = dynamic(() => import('./Product3DTwin'), {
  ssr: false,
  loading: () => <div role="img" aria-label="Loading 3D NFT digital twin" className="vv3-twinLoading">LOADING 3D TWIN</div>,
});

export default function RealWorld3DNFT({ item, hero = false }) {
  const price = item?.customerPriceUsd ? `$${item.customerPriceUsd}` : null;
  const preview = item?.previewUri;
  const titleId = `twin-${item?.id || 'object'}`;
  const twinUrl = `/twin?asset=${encodeURIComponent(item?.id || '')}`;

  return (
    <figure className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''}`} aria-labelledby={titleId}>
      <div className="vv3-grid" aria-hidden="true" />
      <div className="vv3-twinHeader">
        <span className="vv3-twinPill"><span aria-hidden="true">◆</span> 3D NFT INCLUDED</span>
        <span className="vv3-twinSource">REAL PRODUCT DIGITAL TWIN</span>
      </div>
      {preview && (
        <div className="vv3-realProductReference" aria-hidden="true">
          <img src={preview} alt="" loading="lazy" decoding="async" />
          <span>REAL PRODUCT REFERENCE</span>
        </div>
      )}
      <div className="vv3-verified" aria-hidden="true">
        <span style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>◆</span>
        <div><small>LIVE 3D NFT</small><b>DRAG · ORBIT · ZOOM</b></div>
      </div>
      <div className="vv3-nftBadge" aria-hidden="true">
        <span>REAL PRODUCT + 3D NFT</span>
        <small>MATCHED DIGITAL COLLECTIBLE</small>
      </div>
      <Product3DTwin item={item} hero={hero} />
      <figcaption className="vv3-twinFooter" id={titleId}>
        <div className="vv3-twinName"><small>{item?.creator || 'Voxel Vault'}</small><strong>{item?.name || 'Collectible object'}</strong></div>
        <div className="vv3-twinPrice"><small>PHYSICAL + DIGITAL</small>{price && <strong>{price}</strong>}</div>
        <a className="vv3-twinOpen" href={twinUrl} aria-label={`Open permanent 3D NFT for ${item?.name || 'this collectible'}`}>OPEN 3D NFT ↗</a>
      </figcaption>
    </figure>
  );
}

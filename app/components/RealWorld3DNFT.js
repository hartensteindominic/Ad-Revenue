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
  const twinUrl = `/twin?asset=${encodeURIComponent(item?.id || '')}`;

  return (
    <figure className={`vv3-modelFrame ${hero ? 'vv3-modelFrameHero' : ''}`} aria-labelledby={titleId}>
      <div className="vv3-grid" aria-hidden="true" />
      <div className="vv3-twinHeader">
        <span className="vv3-twinPill"><span aria-hidden="true">◆</span> 3D NFT INCLUDED</span>
        <span className="vv3-twinSource">REAL-WORLD DIGITAL TWIN</span>
      </div>
      <div className="vv3-verified" aria-hidden="true">
        <span style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>◆</span>
        <div><small>LIVE 3D</small><b>DRAG · ORBIT · ZOOM</b></div>
      </div>
      <div className="vv3-nftBadge" aria-hidden="true" style={{position:'absolute',left:16,bottom:62,zIndex:4,display:'flex',flexDirection:'column',gap:3,padding:'8px 11px',borderRadius:10,border:'1px solid rgba(169,146,255,.28)',background:'rgba(7,9,16,.72)',backdropFilter:'blur(12px)',boxShadow:'0 10px 28px rgba(0,0,0,.28)'}}>
        <span style={{fontSize:9,fontWeight:900,letterSpacing:'.16em',color:'#d8d0ff'}}>ORIGINAL VAULT ARTWORK</span>
        <small style={{fontSize:8,letterSpacing:'.12em',color:'#8d96ad'}}>PERMANENT 3D PRESENTATION</small>
      </div>
      <Product3DTwin item={item} hero={hero} />
      <figcaption className="vv3-twinFooter" id={titleId}>
        <div className="vv3-twinName"><small>{item?.creator || 'Voxel Vault'}</small><strong>{item?.name || 'Collectible object'}</strong></div>
        <div className="vv3-twinPrice"><small>PHYSICAL + DIGITAL</small>{price && <strong>{price}</strong>}</div>
        <a className="vv3-twinOpen" href={twinUrl} aria-label={`Open permanent 3D NFT for ${item?.name || 'this collectible'}`} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 10px',borderRadius:9,border:'1px solid rgba(169,146,255,.34)',background:'rgba(141,107,255,.1)',color:'#e8e3ff',fontSize:10,fontWeight:850,letterSpacing:'.08em',textDecoration:'none',whiteSpace:'nowrap'}}>OPEN 3D NFT ↗</a>
      </figcaption>
    </figure>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { REAL_WORLD_CATALOG } from '../../lib/realWorldCatalog';
import './VaultHomeV3.css';

const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 13 13 5"/><path d="M7 5h6v6"/></>,
    cube: <><path d="m10 2.5 6.5 3.7v7.6L10 17.5l-6.5-3.7V6.2Z"/><path d="m3.7 6.3 6.3 3.6 6.3-3.6M10 9.9v7.3"/></>,
    shield: <><path d="M10 2.5 16 5v4.5c0 3.6-2.2 6.3-6 8-3.8-1.7-6-4.4-6-8V5Z"/><path d="m7.2 10 1.8 1.8 3.8-4"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand() {
  return <Link href="/" className="vv3-brand" aria-label="Voxel Vault home"><span className="vv3-brandMark"><i/><i/><i/></span><span>VOXEL <b>VAULT</b></span></Link>;
}

function Automatic3D({ item, hero = false }) {
  const host = useRef(null);
  const timer = useRef(null);
  const [visible, setVisible] = useState(hero);
  const [externalLoaded, setExternalLoaded] = useState(false);
  const [externalFailed, setExternalFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (hero || !host.current || typeof IntersectionObserver === 'undefined') {
      if (!hero) setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '350px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [hero]);

  useEffect(() => {
    if (!visible || !item.modelEmbedUrl || externalLoaded) return undefined;
    timer.current = window.setTimeout(() => setExternalFailed(true), 10000);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [visible, item.modelEmbedUrl, externalLoaded]);

  const modelUrl = item.modelEmbedUrl?.replace('autostart=1', 'autostart=0');
  const hasExternalTwin = Boolean(modelUrl) && visible && !externalFailed;
  const twinStatus = externalLoaded ? 'VERIFIED 3D REFERENCE' : 'VOXEL 3D DIGITAL TWIN';

  return <div ref={host} className="vv3-modelFrame" style={{ minHeight: hero ? 420 : 260 }}>
    <div className="vv3-grid"/>

    {visible && <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <ArtPreview
        family={item.family || 'artifact'}
        material={item.material || 'metallic'}
        seed={item.seed}
        rarity={item.rarity}
        interactive
        showcase
        compact={!hero}
        label={false}
      />
    </div>}

    {!imageFailed && <Image src={item.previewUri} alt={`${item.name} physical product reference`} fill priority={hero} sizes={hero ? '(max-width: 900px) 100vw, 50vw' : '(max-width: 900px) 100vw, 33vw'} quality={78} style={{ objectFit: 'cover', opacity: visible ? 0.08 : 0.9, zIndex: 0 }} onError={() => setImageFailed(true)} />}

    {hasExternalTwin && <iframe
      title={`${item.name} verified 3D reference`}
      src={modelUrl}
      style={{ position: 'absolute', inset: 0, zIndex: 2, width: '100%', height: '100%', minHeight: hero ? 420 : 260, border: 0, display: externalLoaded ? 'block' : 'none', background: 'transparent' }}
      allow="autoplay; fullscreen; xr-spatial-tracking"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => { setExternalLoaded(true); if (timer.current) window.clearTimeout(timer.current); }}
      onError={() => setExternalFailed(true)}
    />}

    <div className="vv3-3dBadge" style={{ zIndex: 4 }}><Icon name="cube" size={13}/> 3D NFT · {twinStatus}</div>
    <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 4, display: 'flex', justifyContent: 'space-between', gap: 8, pointerEvents: 'none' }}>
      <span style={{ borderRadius: 999, padding: '6px 9px', background: 'rgba(5,6,12,.66)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,.82)', fontSize: 8, fontWeight: 900, letterSpacing: '.12em' }}>REAL-WORLD OBJECT</span>
      <span style={{ borderRadius: 999, padding: '6px 9px', background: 'rgba(5,6,12,.66)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,.62)', fontSize: 8, fontWeight: 800, letterSpacing: '.1em' }}>{externalLoaded ? 'SOURCE MODEL' : 'DIGITAL TWIN'}</span>
    </div>
  </div>;
}

function BuyBoth({ item }) {
  const ready = Boolean(item.fulfillmentReady && item.purchaseAssetId);
  const margin = Number(item.targetMarginPercent || 0);
  return <div style={{ display: 'grid', gap: 8, padding: '0 14px 14px' }}>
    {ready ? <Link href={`/marketplace?purchase=${encodeURIComponent(item.purchaseAssetId)}`} style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 12, background: '#fff', color: '#080a11', textDecoration: 'none', fontSize: 10, fontWeight: 900, letterSpacing: '.06em' }}>BUY PHYSICAL + 3D NFT · ${item.priceUsd}</Link> : <div style={{ textAlign: 'center', padding: '12px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.68)', fontSize: 10, fontWeight: 800, letterSpacing: '.06em' }}>PHYSICAL + 3D NFT · SUPPLIER MAPPING PENDING</div>}
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, color: 'rgba(255,255,255,.52)', fontSize: 9 }}><span>📦 ships to you</span><span>🧊 NFT in Vault</span><span>↗ {margin}% target margin</span></div>
  </div>;
}

function Card({ item, index }) {
  return <article className="vv3-objectCard">
    <div className="vv3-objectVisual"><Automatic3D item={item}/><span className="vv3-cardIndex">{String(index + 1).padStart(2, '0')}</span><span className="vv3-liveBadge"><i/> REAL OBJECT</span></div>
    <div className="vv3-objectDetails"><div><small>{item.type}</small><h3>{item.name}</h3></div><strong>${item.priceUsd}</strong></div>
    <div className="vv3-objectMeta"><span>{item.sourceName}</span><span>3D NFT TWIN</span></div>
    <BuyBoth item={item}/>
    <div style={{ padding: '0 14px 14px', fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>Real product source is shown for identity and provenance. Voxel Vault checkout remains on-site; the physical sale is enabled only after an authorized supplier/SKU is connected. Pricing is supplier cost plus the configured Vault margin.</div>
  </article>;
}

export default function RealWorldCommerceHome() {
  const hero = REAL_WORLD_CATALOG[0];
  return <main className="vv3-home">
    <div className="vv3-noise" aria-hidden="true"/>
    <header className="vv3-header"><div className="vv3-topbar"><Brand/><nav className="vv3-desktopNav" aria-label="Primary navigation"><Link href="/discover">Discover</Link><Link href="/marketplace">Marketplace</Link><Link href="/room">My vault</Link><Link href="/ai">Intelligence</Link></nav><Link className="vv3-headerCta" href="#collection">Shop physical + NFT <Icon name="arrow" size={15}/></Link></div></header>
    <section className="vv3-hero"><div className="vv3-heroGlow" aria-hidden="true"/><div className="vv3-heroCopy"><div className="vv3-eyebrow"><i/> PHYSICAL + DIGITAL COLLECTION</div><h1>Real objects.<br/><em>3D NFTs.</em></h1><p>Buy the physical product and its 3D digital twin together. The product ships to you; the NFT lives in your Vault, Room, and World.</p><div className="vv3-heroActions"><Link className="vv3-primaryCta" href="#collection">Shop both <Icon name="arrow" size={17}/></Link><Link className="vv3-textCta" href="/room"><span><Icon name="cube" size={14}/></span> Open Vault</Link></div><div className="vv3-proofRow"><span><Icon name="shield" size={16}/><b>Real product</b></span><span><Icon name="cube" size={16}/><b>Automatic 3D twin</b></span><span><Icon name="shield" size={16}/><b>Verified NFT</b></span></div></div><div className="vv3-heroVisual"><div className="vv3-visualTop"><span><i/> 3D NFT</span><small>AUTOMATIC DIGITAL TWIN</small></div><Automatic3D item={hero} hero/><div className="vv3-featureMeta"><div><small>PHYSICAL + DIGITAL</small><strong>{hero.name}</strong><span>{hero.creator} · ${hero.priceUsd}</span></div></div><BuyBoth item={hero}/></div></section>
    <section className="vv3-signalBar"><span>REAL PRODUCTS</span><i/><span>3D DIGITAL TWINS</span><i/><span>ONE CHECKOUT</span><i/><span>NFT + VAULT + WORLD</span></section>
    <section className="vv3-collection" id="collection"><div className="vv3-collectionHead"><div><div className="vv3-sectionLabel"><span>01</span> SHOP THE COLLECTION</div><h2>Buy the object.<br/><em>Own the twin.</em></h2></div><p>Every listing is tied to a real-world source from a real manufacturer or retailer. The customer stays in Voxel Vault. The physical item and its digital collectible are treated as one object identity.</p></div><div className="vv3-objectGrid">{REAL_WORLD_CATALOG.map((item, i) => <Card key={item.id} item={item} index={i}/>)}</div></section>
    <section className="vv3-finalCta"><div><small>VOXEL VAULT</small><h2>Physical in your hands. Digital in your world.</h2><p>Buy both, keep the digital twin in your Vault, place it in your Room, and make it discoverable in the World.</p></div><Link className="vv3-primaryCta" href="/room">Open My Room <Icon name="arrow" size={17}/></Link></section>
  </main>;
}

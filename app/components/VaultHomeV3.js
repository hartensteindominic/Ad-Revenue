'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { getCatalogWindow } from '../../lib/catalog';
import './VaultHomeV3.css';

const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });
const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

const items = getCatalogWindow(0);
const categories = ['All objects', 'Artifacts', 'Vehicles', 'Creatures', 'Architecture'];

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 13 13 5" /><path d="M7 5h6v6" /></>,
    search: <><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 3 3" /></>,
    receipt: <><path d="M5 3h10v14l-2-1.5L11 17l-2-1.5L7 17l-2-1.5Z" /><path d="M8 7h4M8 10h5" /></>,
    spark: <path d="m10 2 1.5 5.5L17 9l-5.5 1.5L10 16l-1.5-5.5L3 9l5.5-1.5Z" />,
    room: <><path d="M3 8.5 10 3l7 5.5V17H3Z" /><path d="M7.5 17v-5h5v5" /></>,
    shield: <><path d="M10 2.5 16 5v4.5c0 3.6-2.2 6.3-6 8-3.8-1.7-6-4.4-6-8V5Z" /><path d="m7.2 10 1.8 1.8 3.8-4" /></>,
    cube: <><path d="m10 2.5 6.5 3.7v7.6L10 17.5l-6.5-3.7V6.2Z" /><path d="m3.7 6.3 6.3 3.6 6.3-3.6M10 9.9v7.3" /></>,
  };
  return <svg aria-hidden="true" className="vv3-icon" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand() {
  return <Link href="/" className="vv3-brand" aria-label="Voxel Vault home"><span className="vv3-brandMark"><i /><i /><i /></span><span>VOXEL <b>VAULT</b></span></Link>;
}

function ObjectModel({ item, hero = false }) {
  if (!item) return null;
  return (
    <div className="vv3-realObjectMedia">
      <img
        src={item.imageUrl}
        alt={item.imageAlt}
        className="vv3-realObjectImage"
        loading={hero ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onError={(event) => { event.currentTarget.style.display = 'none'; }}
      />
      <div className="vv3-realObject3D">
        <Lazy3DPreview minHeight={hero ? 520 : 250} rootMargin={hero ? '80px' : '320px'}>
          {item.renderMode === 'voxel' && item.shape ? (
            <VoxelViewer shape={item.shape} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} />
          ) : (
            <ArtPreview family={item.family || 'sculpture'} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} interactive={hero} showcase={hero} />
          )}
        </Lazy3DPreview>
      </div>
      <div className="vv3-sourceChip">● ONLINE SOURCE VERIFIED</div>
      <div className="vv3-twinChip">3D DIGITAL TWIN</div>
    </div>
  );
}

function ObjectCard({ item, index }) {
  return (
    <article className="vv3-objectCard" aria-label={`View ${item.name}`}>
      <div className="vv3-objectVisual"><ObjectModel item={item} /><span className="vv3-cardIndex">{String(index + 1).padStart(2, '0')}</span><span className="vv3-liveBadge"><i /> REAL OBJECT</span><span className="vv3-cardArrow" aria-hidden="true"><Icon name="arrow" size={16} /></span></div>
      <Link className="vv3-objectDetails" href={`/marketplace?asset=${encodeURIComponent(item.id)}`}><div><small>{item.type || 'REAL OBJECT'} · {item.brand}</small><h3>{item.name}</h3></div><strong>${item.priceUsd}</strong></Link>
      <div className="vv3-objectMeta"><span>{item.sourceName}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>SHOP ONLINE ↗</a></div>
    </article>
  );
}

export default function VaultHomeV3() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All objects');
  const heroItem = items[0];
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.name} ${item.type} ${item.creator} ${item.material} ${item.family} ${item.brand}`.toLowerCase();
    const type = String(item.type || '').toLowerCase();
    const categoryMatch = category === 'All objects' || type === category.replace(/s$/, '').toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch;
  }), [query, category]);

  return (
    <main className="vv3-shell">
      <header className="vv3-header"><Brand /><nav className="vv3-nav"><Link href="#discover">Discover</Link><Link href="#vault">Vault</Link><Link href="#intelligence">AI</Link></nav><Link className="vv3-headerAction" href="/marketplace">Open Vault <Icon name="arrow" size={15} /></Link></header>
      <section className="vv3-hero" id="discover">
        <div className="vv3-heroCopy"><span className="vv3-kicker">REAL WORLD OBJECTS · DIGITAL TWINS</span><h1>Objects worth<br /><em>finding.</em></h1><p>Discover real products online, inspect their 3D digital twins, and build a verifiable Voxel Vault.</p><div className="vv3-heroActions"><a className="vv3-primary" href="#collection">Explore real objects <Icon name="arrow" size={16} /></a><a className="vv3-secondary" href={heroItem?.sourceUrl} target="_blank" rel="noreferrer">Shop featured object ↗</a></div><div className="vv3-heroStats"><span><b>{items.length}</b> VERIFIED OBJECTS</span><span><b>{items.length}</b> 3D VIEWS</span><span><b>LIVE</b> ONLINE SOURCES</span></div></div>
        <div className="vv3-heroVisual"><ObjectModel item={heroItem} hero /></div>
      </section>
      <section className="vv3-collection" id="collection"><div className="vv3-sectionHead"><div><span className="vv3-kicker">THE COLLECTION</span><h2>Real things.<br /><em>Digital twins.</em></h2></div><div className="vv3-search"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search real objects" aria-label="Search real objects" /></div></div><div className="vv3-filters">{categories.map((entry) => <button key={entry} type="button" className={category === entry ? 'active' : ''} onClick={() => setCategory(entry)}>{entry}</button>)}</div><div className="vv3-objectGrid">{filtered.map((item, index) => <ObjectCard key={item.catalogId || item.id} item={item} index={index} />)}</div>{filtered.length === 0 && <div className="vv3-empty">No verified real-world objects match that search.</div>}</section>
      <section className="vv3-trust" id="intelligence"><div><span className="vv3-kicker">OBJECT PASSPORT</span><h2>Every object starts in<br /><em>the real world.</em></h2></div><p>Voxel Vault separates the physical product source from the digital-twin layer. Online source, real-world image, object identity and collection history remain visible instead of hiding behind synthetic catalog entries.</p><div className="vv3-trustGrid"><span><Icon name="shield" /><b>Source verified</b><small>Trace the object to an online source.</small></span><span><Icon name="cube" /><b>3D twin</b><small>Inspect a deterministic 3D representation.</small></span><span><Icon name="receipt" /><b>Shop online</b><small>Open the original product source.</small></span></div></section>
      <footer className="vv3-footer"><Brand /><span>REAL OBJECTS · VERIFIED SOURCES · DIGITAL TWINS</span><Link href="/marketplace">Marketplace ↗</Link></footer>
    </main>
  );
}

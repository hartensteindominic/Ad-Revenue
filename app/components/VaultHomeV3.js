'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { getCatalogWindow } from '../../lib/catalog';
import './VaultHomeV3.css';

const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });
const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

const items = getCatalogWindow(0, 8);
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
  return (
    <Link href="/" className="vv3-brand" aria-label="Voxel Vault home">
      <span className="vv3-brandMark"><i /><i /><i /></span>
      <span>VOXEL <b>VAULT</b></span>
    </Link>
  );
}

function ObjectModel({ item, hero = false }) {
  if (!item) return null;
  return (
    <Lazy3DPreview minHeight={hero ? 520 : 250} rootMargin={hero ? '80px' : '320px'}>
      {item.renderMode === 'voxel' && item.shape ? (
        <VoxelViewer shape={item.shape} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} />
      ) : (
        <ArtPreview family={item.family || 'sculpture'} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} interactive={hero} showcase={hero} />
      )}
    </Lazy3DPreview>
  );
}

function ObjectCard({ item, index }) {
  return (
    <Link className="vv3-objectCard" href={`/marketplace?asset=${encodeURIComponent(item.id)}`} aria-label={`View ${item.name}`}>
      <div className="vv3-objectVisual">
        <ObjectModel item={item} />
        <span className="vv3-cardIndex">{String(index + 1).padStart(2, '0')}</span>
        <span className="vv3-liveBadge"><i /> DIGITAL TWIN</span>
        <span className="vv3-cardArrow" aria-hidden="true"><Icon name="arrow" size={16} /></span>
      </div>
      <div className="vv3-objectDetails">
        <div><small>{item.type || 'DIGITAL OBJECT'}</small><h3>{item.name}</h3></div>
        <strong>${item.priceUsd}</strong>
      </div>
      <div className="vv3-objectMeta"><span>PHYSICAL + DIGITAL</span><span>{item.rarity || 'ORIGINAL'}</span></div>
    </Link>
  );
}

export default function VaultHomeV3() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All objects');
  const heroItem = items[0];
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.name} ${item.type} ${item.creator} ${item.material} ${item.family}`.toLowerCase();
    const type = String(item.type || '').toLowerCase();
    const categoryMatch = category === 'All objects' || type === category.replace(/s$/, '').toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch;
  }), [query, category]);

  return (
    <main className="vv3-home">
      <div className="vv3-noise" aria-hidden="true" />
      <header className="vv3-header">
        <div className="vv3-topbar">
          <Brand />
          <nav className="vv3-desktopNav" aria-label="Primary navigation">
            <Link href="/discover">Discover</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/room">My vault</Link>
            <Link href="/ai">Intelligence</Link>
          </nav>
          <div className="vv3-topActions">
            <Link className="vv3-roundButton" href="#collection" aria-label="Search the collection"><Icon name="search" /></Link>
            <Link className="vv3-headerCta" href="/room">Enter vault <Icon name="arrow" size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="vv3-hero">
        <div className="vv3-heroGlow" aria-hidden="true" />
        <div className="vv3-heroCopy">
          <div className="vv3-eyebrow"><i /> THE PHYSICAL–DIGITAL COLLECTION</div>
          <h1>Objects you own.<br /><em>Worlds you unlock.</em></h1>
          <p>Turn real purchases into intelligent 3D collectibles—verified, explorable, and built to stay yours.</p>
          <div className="vv3-heroActions">
            <Link className="vv3-primaryCta" href="/discover">Explore objects <Icon name="arrow" size={17} /></Link>
            <Link className="vv3-textCta" href="#how-it-works"><span><Icon name="spark" size={14} /></span> See how it works</Link>
          </div>
          <div className="vv3-proofRow" aria-label="Product benefits">
            <span><Icon name="shield" size={16} /><b>Receipt verified</b></span>
            <span><Icon name="cube" size={16} /><b>Interactive 3D</b></span>
            <span><Icon name="room" size={16} /><b>Yours to keep</b></span>
          </div>
        </div>

        <div className="vv3-heroVisual" aria-label="Interactive featured digital twin">
          <div className="vv3-visualTop"><span><i /> LIVE OBJECT</span><small>DRAG TO INSPECT</small></div>
          <div className="vv3-modelFrame"><div className="vv3-grid" /><div className="vv3-orbit" /><ObjectModel item={heroItem} hero /></div>
          <div className="vv3-featureMeta">
            <div><small>GENESIS OBJECT / 001</small><strong>{heroItem?.name || 'Vault Artifact'}</strong><span>{heroItem?.material || 'Rare material'} · {heroItem?.rarity || 'Original'}</span></div>
            <Link href={`/marketplace?asset=${heroItem?.id || 1}`} aria-label="View featured object"><Icon name="arrow" size={20} /></Link>
          </div>
          <div className="vv3-verified"><span><Icon name="shield" size={15} /></span><div><small>AUTHENTICITY</small><b>VERIFIED</b></div></div>
        </div>
      </section>

      <section className="vv3-signalBar" aria-label="Platform capabilities">
        <span>MERCHANT VERIFIED</span><i />
        <span>3D DIGITAL TWINS</span><i />
        <span>ONCHAIN PROVENANCE</span><i />
        <span>OBJECT INTELLIGENCE</span>
      </section>

      <section className="vv3-story" id="how-it-works">
        <div className="vv3-sectionLabel"><span>01</span> THE IDEA</div>
        <div className="vv3-storyTitle"><small>MORE THAN A MARKETPLACE</small><h2>Your things deserve<br /><em>a digital life.</em></h2></div>
        <p>Voxel Vault connects every meaningful object to a living digital identity. Verify the purchase, create the twin, then make it part of your world.</p>
      </section>

      <section className="vv3-journey" aria-label="How Voxel Vault works">
        <Link href="/receipt"><div className="vv3-stepTop"><span>01</span><Icon name="arrow" /></div><div className="vv3-stepIcon"><Icon name="receipt" size={25} /></div><small>CAPTURE</small><h3>Verify the purchase</h3><p>Turn a merchant-confirmed receipt into a secure object passport.</p></Link>
        <Link href="/passport"><div className="vv3-stepTop"><span>02</span><Icon name="arrow" /></div><div className="vv3-stepIcon"><Icon name="spark" size={25} /></div><small>TRANSFORM</small><h3>Create the twin</h3><p>Give the object an intelligent identity and an interactive 3D form.</p></Link>
        <Link href="/room"><div className="vv3-stepTop"><span>03</span><Icon name="arrow" /></div><div className="vv3-stepIcon"><Icon name="room" size={25} /></div><small>EXPERIENCE</small><h3>Build your world</h3><p>Collect, organize, share, and explore everything you own.</p></Link>
      </section>

      <section className="vv3-collection" id="collection">
        <div className="vv3-collectionHead">
          <div><div className="vv3-sectionLabel"><span>02</span> LIVE COLLECTION</div><h2>Objects worth<br /><em>discovering.</em></h2></div>
          <p>A growing universe of physical objects and their interactive digital counterparts.</p>
        </div>
        <div className="vv3-collectionTools">
          <div className="vv3-categories" role="group" aria-label="Filter objects by category">{categories.map((name) => <button type="button" key={name} className={category === name ? 'active' : ''} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <label className="vv3-searchBox"><Icon name="search" size={16} /><input type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects" aria-label="Search objects" /></label>
        </div>
        <p className="vv3-srOnly" aria-live="polite">Showing {filtered.length} {filtered.length === 1 ? 'object' : 'objects'}.</p>
        <div className="vv3-objectGrid">{filtered.map((item, index) => <ObjectCard key={item.id} item={item} index={index} />)}</div>
        {!filtered.length && <div className="vv3-emptyState" role="status"><Icon name="search" size={24} /><strong>No matching objects</strong><span>Try a different search or category.</span></div>}
        <Link className="vv3-viewAll" href="/marketplace">View full collection <Icon name="arrow" size={16} /></Link>
      </section>

      <section className="vv3-intelligence">
        <div className="vv3-aiVisual"><div className="vv3-aiHalo haloOne" /><div className="vv3-aiHalo haloTwo" /><div className="vv3-aiCore"><Icon name="spark" size={34} /></div><span><i /> CRESTODIAN ONLINE</span></div>
        <div className="vv3-aiCopy"><div className="vv3-sectionLabel"><span>03</span> OBJECT INTELLIGENCE</div><h2>A vault that<br /><em>understands.</em></h2><p>Ask what an object is, where it came from, what makes it rare, and how it connects to everything else you own.</p><ul><li><i /> Collection intelligence</li><li><i /> Provenance research</li><li><i /> Spatial organization</li></ul><Link className="vv3-lightCta" href="/ai">Meet Crestodian <Icon name="arrow" size={16} /></Link></div>
      </section>

      <section className="vv3-finalCta">
        <div><small>YOUR WORLD, VERIFIED</small><h2>Start with one object.</h2><p>Scan a purchase and watch it become something more.</p></div>
        <Link className="vv3-primaryCta" href="/receipt">Create your first twin <Icon name="arrow" size={17} /></Link>
      </section>

      <footer className="vv3-footer">
        <div className="vv3-footerTop"><Brand /><p>Real objects. Intelligent twins.<br />One living collection.</p><nav><Link href="/discover">Discover</Link><Link href="/marketplace">Marketplace</Link><Link href="/receipt">Scan receipt</Link><Link href="/room">My vault</Link><Link href="/ai">Intelligence</Link></nav></div>
        <div className="vv3-footerBottom"><span>© 2026 VOXEL VAULT</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><span className="vv3-status"><i /> VOXEL VAULT / 2026</span></div>
      </footer>

      <nav className="vv3-mobileNav" aria-label="Mobile navigation"><Link className="active" href="/discover"><Icon name="search" />Discover</Link><Link href="/receipt"><Icon name="receipt" />Scan</Link><Link href="/room"><Icon name="room" />Vault</Link><Link href="/ai"><Icon name="spark" />AI</Link></nav>
    </main>
  );
}

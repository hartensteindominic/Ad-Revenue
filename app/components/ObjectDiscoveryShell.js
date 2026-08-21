'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogWindow } from '../../lib/catalog';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });

const FILTERS = ['All', 'Near me', 'Rare', 'Sponsored', 'Creators', '3D'];
const FEATURED = getCatalogWindow(0, 6);

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const rad = n => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function distanceLabel(meters) {
  if (meters == null) return 'Location off';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function ObjectVisual({ item }) {
  const props = {
    seed: item?.seed || `object-${item?.id || item?.name || 'vault'}`,
    rarity: item?.rarity || 'Rare',
    material: item?.material || 'digital',
    compact: true,
    showcase: false,
    interactive: false,
    label: false,
  };

  return (
    <Lazy3DPreview minHeight={220} rootMargin="260px">
      {item?.renderMode === 'voxel' && item?.shape
        ? <VoxelViewer shape={item.shape} {...props} />
        : <ArtPreview family={item?.family || 'sculpture'} {...props} />}
    </Lazy3DPreview>
  );
}

function ObjectCard({ item, nearby = false }) {
  const href = nearby ? `/hunt?drop=${encodeURIComponent(item.id)}` : '/#drops';
  return (
    <article className="objectCard">
      <div className="objectMedia">
        <ObjectVisual item={item} />
        <div className="mediaShade" />
        {nearby && <span className="signalBadge"><i /> LIVE</span>}
        {!nearby && <span className={`rarityBadge ${String(item?.rarity || '').toLowerCase()}`}>{item?.rarity || 'Rare'}</span>}
        <span className="threeBadge">3D</span>
      </div>
      <div className="objectBody">
        <div className="objectMeta">
          <span>{item?.type || item?.family || 'Digital object'}</span>
          <h3>{item?.name || 'Unknown object'}</h3>
          <p>{nearby ? `${distanceLabel(item.distance)} · ${item.quantity ?? '—'} left` : `${item?.creator || 'Voxel Vault'}${item?.price ? ` · ${item.price} ETH` : ''}`}</p>
        </div>
        <Link href={href} className="objectAction" aria-label={`View ${item?.name || 'object'}`}>
          <span>↗</span>
        </Link>
      </div>
    </article>
  );
}

export default function ObjectDiscoveryShell() {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState(null);
  const [locationState, setLocationState] = useState('off');
  const [drops, setDrops] = useState([]);
  const [loadingDrops, setLoadingDrops] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingDrops(true);
    fetch('/api/drops', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('feed unavailable')))
      .then(data => { if (!cancelled) setDrops(Array.isArray(data?.drops) ? data.drops : []); })
      .catch(() => { if (!cancelled) setDrops([]); })
      .finally(() => { if (!cancelled) setLoadingDrops(false); });
    return () => { cancelled = true; };
  }, []);

  const useLocation = () => {
    if (!navigator.geolocation) return setLocationState('unavailable');
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationState('on'); },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const featured = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURED.filter(item => {
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material || ''}`.toLowerCase();
      const search = !q || text.includes(q);
      const rare = ['Rare', 'Epic', 'Mythic'].includes(item.rarity);
      const creator = item.creator !== 'Voxel Vault';
      const match = filter === 'All' || filter === '3D' || (filter === 'Rare' && rare) || (filter === 'Creators' && creator);
      return search && match;
    });
  }, [filter, query]);

  const nearby = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drops
      .map(drop => ({ ...drop, distance: distanceMeters(position, drop) }))
      .filter(drop => {
        const c = drop.collectible || {};
        const text = `${drop.name || ''} ${c.name || ''} ${c.family || ''} ${c.rarity || ''}`.toLowerCase();
        const sponsored = Boolean(drop.sponsored || c.sponsored || drop.campaignId || c.campaignId);
        const rare = ['rare', 'epic', 'mythic', 'Rare', 'Epic', 'Mythic'].includes(c.rarity);
        const search = !q || text.includes(q);
        const match = filter === 'All' || filter === 'Near me' || filter === '3D' || (filter === 'Rare' && rare) || (filter === 'Sponsored' && sponsored);
        return search && match && (position ? drop.distance != null && drop.distance <= 5000 : filter !== 'Near me');
      })
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 8)
      .map(drop => ({ ...drop.collectible, id: drop.id, name: drop.collectible?.name || drop.name, distance: drop.distance, quantity: drop.quantity, renderMode: drop.collectible?.renderMode }));
  }, [drops, filter, position, query]);

  const showNearby = filter === 'Near me' || (position && nearby.length > 0);

  return (
    <section className="objectFinder" aria-labelledby="object-finder-title">
      <div className="ambient ambientA" /><div className="ambient ambientB" />
      <header className="finderHeader">
        <Link href="/" className="brand" aria-label="Voxel Vault home"><b>V</b><span>VOXEL VAULT</span></Link>
        <button className={`locationButton ${locationState}`} onClick={useLocation} disabled={locationState === 'loading'} type="button">
          <i />{locationState === 'on' ? 'Near you' : locationState === 'loading' ? 'Locating' : 'Location'}
        </button>
      </header>

      <div className="hero">
        <div className="eyebrow">DISCOVER · COLLECT · OWN</div>
        <h1 id="object-finder-title">Find what’s <em>worth finding.</em></h1>
      </div>

      <label className="searchBox">
        <span>⌕</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the Vault" aria-label="Search the Vault" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
      </label>

      <nav className="filters" aria-label="Filters">
        {FILTERS.map(name => <button key={name} className={filter === name ? 'active' : ''} type="button" onClick={() => setFilter(name)}>{name}</button>)}
      </nav>

      {showNearby && (
        <section className="sectionBlock">
          <div className="sectionTitle"><div><span>NEARBY</span><h2>Around you</h2></div>{position && <small>Live</small>}</div>
          {nearby.length ? <div className="cardRail">{nearby.map(item => <ObjectCard key={item.id} item={item} nearby />)}</div> : <div className="empty">{loadingDrops ? 'Finding…' : 'Nothing nearby yet.'}</div>}
        </section>
      )}

      <section className="sectionBlock featuredBlock">
        <div className="sectionTitle"><div><span>THE VAULT</span><h2>Worth a look</h2></div><small>{featured.length}</small></div>
        <div className="cardRail">{featured.map(item => <ObjectCard key={item.id} item={item} />)}{!featured.length && <div className="empty">No matches.</div>}</div>
      </section>

      <footer className="finderFooter">
        <Link href="/marketplace">Market</Link><Link href="/trade">Trade</Link><Link href="/hunt" className="collectTab">Collect</Link><Link href="/terms">Terms</Link>
      </footer>

      <style jsx>{`
        .objectFinder{position:relative;isolation:isolate;max-width:1180px;margin:0 auto;padding:0 18px 28px;overflow:hidden;color:#f6f7fb}.ambient{position:absolute;z-index:-1;border-radius:999px;filter:blur(80px);pointer-events:none}.ambientA{width:360px;height:260px;right:-160px;top:20px;background:rgba(124,91,255,.15)}.ambientB{width:300px;height:220px;left:-170px;top:460px;background:rgba(40,195,255,.07)}
        .finderHeader{height:58px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07)}.brand{display:flex;align-items:center;gap:9px;color:#f5f6fa;text-decoration:none}.brand b{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:linear-gradient(135deg,#a98cff,#53dcff);color:#090b12;font-size:14px}.brand span{font-size:10px;font-weight:850;letter-spacing:.14em}.locationButton{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.04);color:#c9cedb;font-size:11px}.locationButton i{width:6px;height:6px;border-radius:50%;background:#687083}.locationButton.on i{background:#5df1ae;box-shadow:0 0 12px #5df1ae}.locationButton.loading{opacity:.65}
        .hero{padding:34px 0 20px}.eyebrow,.sectionTitle span{font-size:9px;letter-spacing:.17em;font-weight:900;color:#a998ff}.hero h1{margin:8px 0 0;max-width:680px;font-size:clamp(36px,7vw,64px);line-height:.96;letter-spacing:-.055em}.hero h1 em{font-style:normal;color:#a48aff}
        .searchBox{height:54px;display:flex;align-items:center;gap:10px;padding:0 15px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.045);box-shadow:0 14px 40px rgba(0,0,0,.15),inset 0 1px rgba(255,255,255,.05)}.searchBox>span{font-size:22px;color:#81899b}.searchBox input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-size:15px}.searchBox input::placeholder{color:#6f7789}.searchBox button{border:0;background:none;color:#8790a2;font-size:22px}
        .filters{display:flex;gap:7px;overflow-x:auto;padding:13px 0 3px;scrollbar-width:none}.filters::-webkit-scrollbar{display:none}.filters button{flex:0 0 auto;padding:8px 12px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.035);color:#8f97aa;font-size:11px}.filters button.active{background:#f4f5f8;border-color:#f4f5f8;color:#080a10;font-weight:850}
        .sectionBlock{margin-top:27px}.sectionTitle{display:flex;align-items:end;justify-content:space-between;margin-bottom:11px}.sectionTitle h2{margin:4px 0 0;font-size:20px;letter-spacing:-.025em}.sectionTitle small{font-size:10px;color:#737c90}.sectionTitle small:has(+ *){}.cardRail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.objectCard{overflow:hidden;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 16px 45px rgba(0,0,0,.14);transition:transform .2s ease,border-color .2s ease}.objectCard:hover{transform:translateY(-3px);border-color:rgba(164,138,255,.4)}.objectMedia{position:relative;min-height:220px;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(133,102,255,.2),transparent 52%),#070910}.objectMedia :global(canvas){display:block;width:100%!important;height:100%!important}.mediaShade{position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(5,7,13,.48));pointer-events:none}.signalBadge,.rarityBadge,.threeBadge{position:absolute;top:11px;border:1px solid rgba(255,255,255,.1);background:rgba(7,9,15,.66);backdrop-filter:blur(12px);border-radius:999px;padding:5px 8px;font-size:8px;font-weight:900;letter-spacing:.1em}.signalBadge{left:11px;color:#63efad}.signalBadge i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#63efad;margin-right:5px;box-shadow:0 0 8px #63efad}.rarityBadge{right:11px;color:#d8dcE7}.rarityBadge.mythic{color:#ff9cf4}.rarityBadge.epic{color:#b69cff}.rarityBadge.rare{color:#78d9ff}.threeBadge{left:11px;bottom:11px;top:auto;color:#fff}.objectBody{display:flex;align-items:center;gap:10px;padding:13px}.objectMeta{min-width:0;flex:1}.objectMeta>span{display:block;color:#81899b;font-size:8px;text-transform:uppercase;letter-spacing:.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.objectMeta h3{margin:4px 0 2px;font-size:16px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.objectMeta p{margin:0;color:#6f7789;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.objectAction{display:grid;place-items:center;flex:0 0 35px;width:35px;height:35px;border:1px solid rgba(255,255,255,.1);border-radius:11px;color:#f1f2f6;text-decoration:none;background:rgba(255,255,255,.04);font-size:15px}.empty{padding:24px;border:1px dashed rgba(255,255,255,.1);border-radius:16px;color:#777f91;font-size:12px;text-align:center}.finderFooter{display:flex;justify-content:center;gap:22px;padding:25px 0 4px;color:#626b7d;font-size:10px}.finderFooter a{color:#858ea0;text-decoration:none}.finderFooter .collectTab{color:#b3a3ff}
        @media(max-width:900px){.cardRail{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.objectFinder{padding:0 14px 26px}.finderHeader{height:54px}.brand span{font-size:9px}.hero{padding:27px 0 17px}.hero h1{font-size:39px}.searchBox{height:52px}.sectionBlock{margin-top:24px}.cardRail{display:flex;overflow-x:auto;gap:11px;margin-right:-14px;padding-right:14px;padding-bottom:4px;scroll-snap-type:x mandatory}.objectCard{flex:0 0 82vw;scroll-snap-align:start}.objectMedia{min-height:230px}.sectionTitle h2{font-size:18px}.finderFooter{padding-bottom:4px}}
      `}</style>
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogWindow } from '../../lib/catalog';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });

const FILTERS = ['All', 'Near me', 'Rare', 'Sponsored', '3D'];
const FEATURED = getCatalogWindow(0, 8);

function meters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function distance(value) {
  if (value == null) return '';
  return value < 1000 ? `${value}m` : `${(value / 1000).toFixed(1)}km`;
}

function Preview({ item }) {
  const common = { seed: item?.seed || `vv-${item?.id || item?.name || 'object'}`, rarity: item?.rarity || 'Rare', material: item?.material || 'digital', compact: true, showcase: false, interactive: false, label: false };
  return <Lazy3DPreview minHeight={240} rootMargin="320px">{item?.renderMode === 'voxel' && item?.shape ? <VoxelViewer shape={item.shape} {...common} /> : <ArtPreview family={item?.family || 'sculpture'} {...common} />}</Lazy3DPreview>;
}

function Card({ item, live = false }) {
  const name = item?.name || 'Unknown object';
  return (
    <article className="card">
      <div className="visual">
        <Preview item={item} />
        <div className="shine" />
        {live ? <span className="live"><i /> LIVE</span> : <span className={`rarity ${String(item?.rarity || '').toLowerCase()}`}>{item?.rarity || 'RARE'}</span>}
        <span className="tag3d">3D</span>
      </div>
      <div className="cardInfo">
        <div className="copy"><span>{item?.type || item?.family || 'Digital object'}</span><h3>{name}</h3><p>{live ? `${distance(item.distance)} · ${item.quantity ?? '—'} left` : item?.creator || 'Voxel Vault'}</p></div>
        <Link className="go" href={live ? `/hunt?drop=${encodeURIComponent(item.id)}` : '/marketplace'} aria-label={`Open ${name}`}>↗</Link>
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    fetch('/api/drops', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('feed')))
      .then(data => { if (!dead) setDrops(Array.isArray(data?.drops) ? data.drops : []); })
      .catch(() => { if (!dead) setDrops([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, []);

  function locate() {
    if (!navigator.geolocation) return setLocationState('unavailable');
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      p => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocationState('on'); },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const featured = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURED.filter(item => {
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material || ''}`.toLowerCase();
      const matchText = !q || text.includes(q);
      const rare = ['Rare', 'Epic', 'Mythic'].includes(item.rarity);
      const matchFilter = filter === 'All' || filter === '3D' || (filter === 'Rare' && rare);
      return matchText && matchFilter;
    });
  }, [filter, query]);

  const nearby = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drops.map(drop => ({ ...drop, distance: meters(position, drop) })).filter(drop => {
      const c = drop.collectible || {};
      const text = `${drop.name || ''} ${c.name || ''} ${c.family || ''} ${c.rarity || ''}`.toLowerCase();
      const sponsored = Boolean(drop.sponsored || c.sponsored || drop.campaignId || c.campaignId);
      const rare = ['rare', 'epic', 'mythic', 'Rare', 'Epic', 'Mythic'].includes(c.rarity);
      const textOk = !q || text.includes(q);
      const filterOk = filter === 'All' || filter === 'Near me' || filter === '3D' || (filter === 'Rare' && rare) || (filter === 'Sponsored' && sponsored);
      return textOk && filterOk && (position ? drop.distance != null && drop.distance <= 5000 : filter !== 'Near me');
    }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 8).map(drop => ({ ...drop.collectible, id: drop.id, name: drop.collectible?.name || drop.name, distance: drop.distance, quantity: drop.quantity, renderMode: drop.collectible?.renderMode }));
  }, [drops, filter, position, query]);

  const showNearby = filter === 'Near me' || Boolean(position && nearby.length);

  return (
    <main className="app" aria-label="Voxel Vault">
      <div className="bg bgOne" /><div className="bg bgTwo" />
      <header className="topbar">
        <Link href="/" className="logo"><b>V</b><strong>VOXEL VAULT</strong></Link>
        <button type="button" className={`location ${locationState}`} onClick={locate} disabled={locationState === 'loading'}><i />{locationState === 'on' ? 'Near you' : locationState === 'loading' ? 'Locating' : 'Location'}</button>
      </header>

      <section className="hero">
        <div className="eyebrow">WALK · DISCOVER · COLLECT · EARN</div>
        <h1>Objects worth <em>finding.</em></h1>
        <p>Real objects. Digital worlds. Yours when verified.</p>
      </section>

      <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search objects" aria-label="Search objects" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear">×</button>}</label>
      <nav className="filters" aria-label="Object filters">{FILTERS.map(name => <button key={name} type="button" className={filter === name ? 'selected' : ''} onClick={() => setFilter(name)}>{name}</button>)}</nav>

      {showNearby && <section className="section"><div className="heading"><div><small>NEARBY</small><h2>Around you</h2></div>{position && <span className="liveText">● Live</span>}</div>{nearby.length ? <div className="rail">{nearby.map(item => <Card key={item.id} item={item} live />)}</div> : <div className="empty">{loading ? 'Finding…' : 'Nothing nearby yet.'}</div>}</section>}

      <section className="section"><div className="heading"><div><small>THE VAULT</small><h2>Worth a look</h2></div><Link href="/marketplace">See all</Link></div><div className="rail">{featured.map(item => <Card key={item.id} item={item} />)}{!featured.length && <div className="empty">No matches.</div>}</div></section>

      <div className="quick"><Link href="/hunt"><span>⌖</span><b>Find</b><small>Explore</small></Link><Link href="/marketplace"><span>◈</span><b>Market</b><small>Collect</small></Link><Link href="/trade"><span>⇄</span><b>Trade</b><small>Offers</small></Link></div>
      <footer><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><span>© Voxel Vault</span></footer>

      <style jsx>{`
        .app{min-height:100vh;position:relative;isolation:isolate;overflow:hidden;background:#060811;color:#f5f6fa;padding:0 max(16px,calc((100vw - 1120px)/2)) 110px}.bg{position:absolute;z-index:-1;border-radius:999px;filter:blur(100px);pointer-events:none}.bgOne{width:420px;height:300px;right:-180px;top:-80px;background:rgba(128,91,255,.17)}.bgTwo{width:300px;height:260px;left:-180px;top:600px;background:rgba(45,190,255,.07)}
        .topbar{height:62px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07)}.logo{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none}.logo b{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#aa8cff,#52dfff);color:#080a11;font-weight:950}.logo strong{font-size:10px;letter-spacing:.14em}.location{display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#c8ceda;border-radius:999px;padding:8px 11px;font-size:11px}.location i{width:6px;height:6px;border-radius:50%;background:#697286}.location.on i{background:#5ff0ae;box-shadow:0 0 10px #5ff0ae}
        .hero{padding:35px 0 20px}.eyebrow,.heading small{font-size:9px;letter-spacing:.17em;font-weight:900;color:#a997ff}.hero h1{margin:9px 0 8px;font-size:clamp(42px,8vw,70px);line-height:.92;letter-spacing:-.06em;max-width:720px}.hero h1 em{font-style:normal;color:#a48aff}.hero p{margin:0;color:#858ea1;font-size:13px}
        .search{height:55px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.11);border-radius:17px;background:rgba(255,255,255,.045);padding:0 15px;box-shadow:0 18px 50px rgba(0,0,0,.16)}.search>span{font-size:22px;color:#858da0}.search input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font-size:15px}.search input::placeholder{color:#6f7789}.search button{border:0;background:none;color:#8991a3;font-size:22px}
        .filters{display:flex;gap:7px;overflow:auto;padding:12px 0 3px;scrollbar-width:none}.filters::-webkit-scrollbar{display:none}.filters button{flex:0 0 auto;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#8f97aa;border-radius:999px;padding:8px 12px;font-size:11px}.filters button.selected{background:#f5f6f9;color:#080a11;border-color:#f5f6f9;font-weight:900}
        .section{margin-top:30px}.heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:11px}.heading h2{margin:4px 0 0;font-size:20px;letter-spacing:-.03em}.heading>a{color:#9e91ff;text-decoration:none;font-size:11px}.liveText{font-size:10px;color:#5ff0ae}.rail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:21px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 18px 55px rgba(0,0,0,.18)}.visual{position:relative;min-height:240px;background:radial-gradient(circle at 50% 40%,rgba(137,104,255,.2),transparent 53%),#070910;overflow:hidden}.visual :global(canvas){display:block;width:100%!important;height:100%!important}.shine{position:absolute;inset:48% 0 0;background:linear-gradient(transparent,rgba(5,7,13,.55));pointer-events:none}.live,.rarity,.tag3d{position:absolute;top:11px;padding:5px 8px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(5,7,13,.68);backdrop-filter:blur(12px);font-size:8px;font-weight:900;letter-spacing:.1em}.live{left:11px;color:#60efad}.live i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#60efad;margin-right:5px;box-shadow:0 0 9px #60efad}.rarity{right:11px;color:#d9dce6}.rarity.rare{color:#7bdcff}.rarity.epic{color:#b69cff}.rarity.mythic{color:#ff9df5}.tag3d{left:11px;top:auto;bottom:11px;color:#fff}.cardInfo{display:flex;align-items:center;gap:10px;padding:13px}.copy{min-width:0;flex:1}.copy>span{display:block;color:#7e879a;text-transform:uppercase;letter-spacing:.1em;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy h3{margin:4px 0 2px;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy p{margin:0;color:#6e778a;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go{display:grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border:1px solid rgba(255,255,255,.1);border-radius:11px;color:#fff;text-decoration:none;background:rgba(255,255,255,.04);font-size:16px}.empty{padding:24px;border:1px dashed rgba(255,255,255,.1);border-radius:16px;color:#737c8f;font-size:12px}.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:28px}.quick a{display:grid;grid-template-columns:34px 1fr;grid-template-rows:1fr 1fr;column-gap:9px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.035);color:#fff;text-decoration:none}.quick span{grid-row:1/3;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(159,137,255,.13);color:#b6a5ff}.quick b{font-size:11px}.quick small{color:#6f7789;font-size:9px}footer{display:flex;justify-content:center;gap:18px;margin-top:24px;color:#60697b;font-size:9px}footer a{color:#777f91;text-decoration:none}
        @media(max-width:760px){.app{padding-left:16px;padding-right:16px}.topbar{height:58px}.logo strong{font-size:9px}.hero{padding:29px 0 18px}.hero h1{font-size:43px}.hero p{font-size:12px}.rail{display:flex;overflow-x:auto;gap:11px;margin-right:-16px;padding-right:16px;scroll-snap-type:x mandatory;scrollbar-width:none}.rail::-webkit-scrollbar{display:none}.card{flex:0 0 min(84vw,360px);scroll-snap-align:start}.visual{min-height:245px}.quick{grid-template-columns:repeat(3,1fr)}.quick a{grid-template-columns:1fr;text-align:center;justify-items:center;gap:5px}.quick span{grid-row:auto}.quick b,.quick small{display:block}.quick small{display:none}}
        @media(min-width:1100px){.app{padding-bottom:50px}.hero{padding-top:50px}.section{margin-top:38px}}
      `}</style>
    </main>
  );
}

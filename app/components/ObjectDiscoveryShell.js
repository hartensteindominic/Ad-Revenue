'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogWindow } from '../../lib/catalog';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });

const FILTERS = ['All', 'Near me', 'Rare', 'Physical', '3D'];
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
  const common = {
    seed: item?.seed || `vv-${item?.id || item?.name || 'object'}`,
    rarity: item?.rarity || 'Rare',
    material: item?.material || 'digital',
    compact: false,
    showcase: true,
    interactive: true,
    label: false,
  };
  return (
    <Lazy3DPreview minHeight={300} rootMargin="700px" placeholder={<div className="previewLoading"><span className="orb" /><b>Loading 3D</b></div>}>
      {item?.renderMode === 'voxel' && item?.shape ? <VoxelViewer shape={item.shape} {...common} /> : <ArtPreview family={item?.family || 'sculpture'} {...common} />}
    </Lazy3DPreview>
  );
}

function Card({ item, live = false }) {
  const name = item?.name || 'Unknown object';
  const physical = item?.physical || item?.type === 'Physical' || item?.material === 'physical';
  return (
    <article className="card">
      <Link className="cardOpen" href={live ? `/hunt?drop=${encodeURIComponent(item.id)}` : '/marketplace'} aria-label={`View ${name}`}>
        <div className="visual">
          <Preview item={item} />
          <div className="shine" />
          {live ? <span className="live"><i /> NEARBY</span> : <span className={`rarity ${String(item?.rarity || '').toLowerCase()}`}>{item?.rarity || 'RARE'}</span>}
          <span className="badges"><b>3D</b>{physical && <b>PHYSICAL</b>}{item?.nft !== false && <b>NFT</b>}</span>
        </div>
        <div className="cardInfo">
          <div className="copy">
            <span>{item?.type || item?.family || 'Collectible'}</span>
            <h3>{name}</h3>
            <p>{live ? `${distance(item.distance)} away` : item?.creator || 'Voxel Vault'}</p>
          </div>
          <span className="arrow">↗</span>
        </div>
      </Link>
      <div className="buyRow">
        <span className="price">{item?.price || 'Explore'}</span>
        <span className="verified">{item?.nft !== false ? 'NFT included' : '3D twin'}</span>
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
      const physical = item?.physical || item?.type === 'Physical' || item?.material === 'physical';
      const matchFilter = filter === 'All' || filter === '3D' || (filter === 'Rare' && rare) || (filter === 'Physical' && physical);
      return matchText && matchFilter;
    });
  }, [filter, query]);

  const nearby = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drops.map(drop => ({ ...drop, distance: meters(position, drop) })).filter(drop => {
      const c = drop.collectible || {};
      const text = `${drop.name || ''} ${c.name || ''} ${c.family || ''} ${c.rarity || ''}`.toLowerCase();
      const rare = ['rare', 'epic', 'mythic'].includes(String(c.rarity || '').toLowerCase());
      const textOk = !q || text.includes(q);
      const filterOk = filter === 'All' || filter === 'Near me' || filter === '3D' || (filter === 'Rare' && rare);
      return textOk && filterOk && (position ? drop.distance != null && drop.distance <= 5000 : filter !== 'Near me');
    }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 8).map(drop => ({
      ...drop.collectible,
      id: drop.id,
      name: drop.collectible?.name || drop.name,
      distance: drop.distance,
      quantity: drop.quantity,
      renderMode: drop.collectible?.renderMode,
      physical: true,
    }));
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
        <div className="eyebrow">FIND · BUY · KEEP</div>
        <h1>Objects worth <em>finding.</em></h1>
        <p>Real objects. 3D twins. One Vault.</p>
      </section>

      <div className="actions">
        <Link href="/receipt"><span>▣</span><b>Scan receipt</b></Link>
        <Link href="/room"><span>◇</span><b>My room</b></Link>
        <Link href="/ai"><span>✦</span><b>Ask AI</b></Link>
      </div>

      <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search objects" aria-label="Search objects" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear">×</button>}</label>
      <nav className="filters" aria-label="Object filters">{FILTERS.map(name => <button key={name} type="button" className={filter === name ? 'selected' : ''} onClick={() => setFilter(name)}>{name}</button>)}</nav>

      {showNearby && <section className="section"><div className="heading"><div><small>NEARBY</small><h2>Find it around you</h2></div>{position && <span className="liveText">● Live</span>}</div>{nearby.length ? <div className="rail">{nearby.map(item => <Card key={item.id} item={item} live />)}</div> : <div className="empty">{loading ? 'Finding…' : 'Nothing nearby yet.'}</div>}</section>}

      <section className="section"><div className="heading"><div><small>THE VAULT</small><h2>Worth a look</h2></div><Link href="/marketplace">See all</Link></div><div className="rail">{featured.map(item => <Card key={item.id} item={item} />)}{!featured.length && <div className="empty">No matches.</div>}</div></section>

      <section className="trust"><div><b>Physical + 3D + NFT</b><span>One identity for the real object and its digital twin.</span></div><Link href="/passport">View passport →</Link></section>

      <footer><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><span>© Voxel Vault</span></footer>
      <nav className="bottom"><Link className="active" href="/"><span>⌂</span><b>Find</b></Link><Link href="/marketplace"><span>◈</span><b>Market</b></Link><Link href="/receipt"><span>▣</span><b>Scan</b></Link><Link href="/room"><span>◇</span><b>Vault</b></Link><Link href="/profile"><span>○</span><b>You</b></Link></nav>

      <style jsx>{`
        .app{min-height:100vh;position:relative;isolation:isolate;overflow:hidden;background:#05070d;color:#f6f7fb;padding:0 max(16px,calc((100vw - 980px)/2)) 110px}.bg{position:absolute;z-index:-1;border-radius:999px;filter:blur(110px);pointer-events:none}.bgOne{width:390px;height:280px;right:-180px;top:-70px;background:rgba(125,92,255,.16)}.bgTwo{width:260px;height:260px;left:-180px;top:650px;background:rgba(65,202,255,.055)}
        .topbar{height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07)}.logo{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none}.logo b{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:linear-gradient(135deg,#aa8cff,#55dcff);color:#080a11;font-weight:950}.logo strong{font-size:10px;letter-spacing:.14em}.location{display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#c8ceda;border-radius:999px;padding:8px 11px;font-size:10px}.location i{width:6px;height:6px;border-radius:50%;background:#6d7688}.location.on i{background:#62efb0;box-shadow:0 0 10px #62efb0}
        .hero{padding:34px 0 18px}.eyebrow,.heading small{font-size:9px;letter-spacing:.17em;font-weight:900;color:#aa98ff}.hero h1{margin:9px 0 8px;font-size:clamp(44px,12vw,72px);line-height:.91;letter-spacing:-.065em;max-width:760px}.hero h1 em{font-style:normal;color:#a28aff}.hero p{margin:0;color:#858ea1;font-size:13px}
        .actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:2px 0 13px}.actions a{display:flex;align-items:center;gap:8px;padding:11px 10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035);color:#eef0f6;text-decoration:none}.actions span{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:rgba(161,137,255,.13);color:#b7a6ff;font-size:13px}.actions b{font-size:9px;white-space:nowrap}
        .search{height:54px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:rgba(255,255,255,.045);padding:0 15px;box-shadow:0 16px 45px rgba(0,0,0,.16)}.search>span{font-size:21px;color:#8a92a4}.search input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font-size:15px}.search input::placeholder{color:#70798b}.search button{border:0;background:none;color:#8991a3;font-size:21px}
        .filters{display:flex;gap:7px;overflow:auto;padding:11px 0 1px;scrollbar-width:none}.filters::-webkit-scrollbar{display:none}.filters button{flex:0 0 auto;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#8f97aa;border-radius:999px;padding:8px 12px;font-size:10px}.filters button.selected{background:#f6f7fa;color:#080a11;border-color:#f6f7fa;font-weight:900}
        .section{margin-top:28px}.heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:11px}.heading h2{margin:4px 0 0;font-size:21px;letter-spacing:-.035em}.heading>a{color:#aaa0ff;text-decoration:none;font-size:10px}.liveText{font-size:9px;color:#61efad}.rail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.card{overflow:hidden;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 18px 55px rgba(0,0,0,.2)}.cardOpen{display:block;color:inherit;text-decoration:none}.visual{position:relative;min-height:300px;background:radial-gradient(circle at 50% 40%,rgba(137,104,255,.19),transparent 55%),#070910;overflow:hidden}.visual :global(canvas){display:block;width:100%!important;height:100%!important}.previewLoading{min-height:300px;display:grid;place-items:center;align-content:center;gap:8px;color:#7d879b;font-size:8px;letter-spacing:.14em;text-transform:uppercase}.orb{width:30px;height:30px;border:1px solid rgba(172,148,255,.55);border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;box-shadow:0 0 28px rgba(153,123,255,.18)}@keyframes spin{to{transform:rotate(360deg)}}.shine{position:absolute;inset:52% 0 0;background:linear-gradient(transparent,rgba(5,7,13,.55));pointer-events:none}.live,.rarity,.badges{position:absolute;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(5,7,13,.68);backdrop-filter:blur(12px);font-size:7px;font-weight:900;letter-spacing:.09em}.live,.rarity{top:10px;padding:5px 8px}.live{left:10px;color:#61efad}.live i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#61efad;margin-right:5px;box-shadow:0 0 8px #61efad}.rarity{right:10px;color:#d8dce7}.rarity.rare{color:#7bdcff}.rarity.epic{color:#b59dff}.rarity.mythic{color:#ff9df5}.badges{left:10px;bottom:10px;display:flex;gap:5px;padding:0;background:none;border:0}.badges b{padding:5px 7px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(5,7,13,.7);color:#e9ebf2}.cardInfo{display:flex;align-items:center;gap:9px;padding:12px 12px 8px}.copy{min-width:0;flex:1}.copy>span{display:block;color:#7e8799;text-transform:uppercase;letter-spacing:.1em;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy h3{margin:4px 0 2px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy p{margin:0;color:#6e778a;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arrow{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);font-size:15px}.buyRow{display:flex;align-items:center;justify-content:space-between;padding:0 12px 12px;color:#7c8598;font-size:8px}.price{color:#f3f4f8;font-weight:900}.verified{color:#a79bff}.empty{padding:24px;border:1px dashed rgba(255,255,255,.1);border-radius:16px;color:#737c8f;font-size:11px}.trust{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;padding:15px;border:1px solid rgba(255,255,255,.08);border-radius:17px;background:linear-gradient(135deg,rgba(157,134,255,.08),rgba(255,255,255,.025))}.trust b,.trust span{display:block}.trust b{font-size:10px}.trust span{margin-top:3px;color:#727b8d;font-size:8px;line-height:1.4}.trust a{flex:0 0 auto;color:#b0a4ff;text-decoration:none;font-size:9px}footer{display:flex;justify-content:center;gap:17px;margin-top:22px;color:#60697b;font-size:8px}footer a{color:#60697b;text-decoration:none}.bottom{position:fixed;z-index:20;left:12px;right:12px;bottom:10px;display:grid;grid-template-columns:repeat(5,1fr);padding:7px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:rgba(10,12,20,.88);backdrop-filter:blur(18px);box-shadow:0 16px 45px rgba(0,0,0,.35);padding-bottom:max(7px,env(safe-area-inset-bottom))}.bottom a{display:grid;place-items:center;gap:2px;color:#70798c;text-decoration:none;font-size:8px}.bottom span{font-size:17px;line-height:17px}.bottom b{font-size:7px;font-weight:700}.bottom .active{color:#b7a7ff}
        @media (max-width:720px){.app{padding-left:16px;padding-right:16px}.hero h1{font-size:clamp(43px,13vw,58px)}.actions b{font-size:8px}.rail{grid-template-columns:1fr;gap:12px}.visual{min-height:330px}.previewLoading{min-height:330px}.cardInfo{padding-top:13px}.copy h3{font-size:17px}.copy p{font-size:10px}.buyRow{font-size:9px}.section{margin-top:31px}}
        @media (min-width:721px){.bottom{display:none}.rail{grid-template-columns:repeat(3,minmax(0,1fr))}.visual,.previewLoading{min-height:260px}}
        @media (prefers-reduced-motion:reduce){.orb{animation:none}}
      `}</style>
    </main>
  );
}

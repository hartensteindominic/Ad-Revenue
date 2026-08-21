'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogWindow } from '../../lib/catalog';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });

const OBJECTS = getCatalogWindow(0, 12);
const FILTERS = ['All', 'Near me', 'Rare', 'Sponsored', '3D'];

function ObjectCard({ item }) {
  const previewProps = { seed: item.seed, rarity: item.rarity, material: item.material, compact: true, label: false };
  return (
    <Link href={`/marketplace?asset=${encodeURIComponent(item.id)}`} className="card" aria-label={`View ${item.name}`}>
      <div className="preview">
        <Lazy3DPreview minHeight={250} rootMargin="500px">
          {item.renderMode === 'voxel' && item.shape ? <VoxelViewer shape={item.shape} {...previewProps} /> : <ArtPreview family={item.family || 'sculpture'} {...previewProps} />}
        </Lazy3DPreview>
        <span className={`rarity ${String(item.rarity).toLowerCase()}`}>{item.rarity}</span>
        <span className="badge">3D</span>
      </div>
      <div className="meta">
        <div><small>{item.type}</small><h3>{item.name}</h3><p>{item.creator}</p></div>
        <strong>{item.price}<i> ETH</i></strong>
      </div>
    </Link>
  );
}

export default function ObjectDiscoveryHome() {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(false);

  const objects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OBJECTS.filter(item => {
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material} ${item.style}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (filter === 'Rare') return ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(item.rarity);
      return true;
    });
  }, [filter, query]);

  function findNearby() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => setLocation(true), () => setLocation(false), { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 });
  }

  return (
    <main className="home">
      <div className="orb orbA" /><div className="orb orbB" />
      <header>
        <Link href="/" className="brand"><b>V</b><span>VOXEL VAULT</span></Link>
        <button className={location ? 'loc active' : 'loc'} onClick={findNearby}><i />{location ? 'Near you' : 'Find nearby'}</button>
      </header>

      <section className="hero">
        <small>WALK · DISCOVER · COLLECT · EARN</small>
        <h1>Objects worth <em>finding.</em></h1>
        <p>3D collectibles made to be discovered.</p>
      </section>

      <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" aria-label="Search collectibles" />{query && <button onClick={() => setQuery('')} aria-label="Clear">×</button>}</label>
      <div className="filters">{FILTERS.map(name => <button key={name} className={filter === name ? 'on' : ''} onClick={() => setFilter(name)}>{name}</button>)}</div>

      <section className="collection">
        <div className="sectionHead"><div><small>THE VAULT</small><h2>3D collectibles</h2></div><Link href="/marketplace">See all</Link></div>
        <div className="grid">{objects.map(item => <ObjectCard key={item.id} item={item} />)}</div>
      </section>

      <section className="callout"><small>FIND · VIEW · COLLECT</small><h2>See the object.<br /><em>Then make it yours.</em></h2><Link href="/marketplace">Open Marketplace →</Link></section>

      <nav className="bottom"><Link href="/discover">⌖<b>Find</b></Link><Link href="/marketplace">◈<b>Collect</b></Link><Link href="/trade">⇄<b>Trade</b></Link></nav>
      <footer><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></footer>

      <style jsx>{`
        .home{min-height:100vh;background:#05060b;color:#f6f7fb;padding:0 16px 40px;overflow:hidden;position:relative;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.home *{box-sizing:border-box}.orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none}.orbA{width:380px;height:380px;right:-210px;top:-140px;background:rgba(126,88,255,.22)}.orbB{width:280px;height:280px;left:-190px;top:760px;background:rgba(52,199,255,.07)}header,.hero,.search,.filters,.collection,.callout,.bottom,footer{position:relative;z-index:1}header{height:62px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08)}.brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#fff}.brand b{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#a98bff,#59dcff);color:#080910;font-weight:950}.brand span{font-size:10px;font-weight:900;letter-spacing:.14em}.loc{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.045);color:#cbd0dc;border-radius:999px;padding:8px 11px;font-size:10px}.loc i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#737d90;margin-right:6px}.loc.active i{background:#5df0aa;box-shadow:0 0 9px #5df0aa}.hero{padding:35px 0 22px}.hero>small,.sectionHead small,.callout>small{font-size:9px;letter-spacing:.17em;font-weight:900;color:#a895ff}.hero h1{font-size:clamp(44px,11vw,72px);line-height:.9;letter-spacing:-.065em;margin:10px 0}.hero h1 em,.callout em{font-style:normal;color:#a894ff}.hero p{font-size:13px;color:#858ea1;margin:0}.search{height:55px;display:flex;align-items:center;gap:10px;padding:0 15px;border:1px solid rgba(255,255,255,.11);border-radius:17px;background:rgba(255,255,255,.045)}.search span{font-size:22px;color:#7e879a}.search input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-size:15px}.search input::placeholder{color:#687185}.search button{border:0;background:none;color:#8d95a7;font-size:21px}.filters{display:flex;gap:7px;overflow:auto;padding:12px 0 2px;scrollbar-width:none}.filters::-webkit-scrollbar{display:none}.filters button{flex:0 0 auto;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#929bad;border-radius:999px;padding:8px 12px;font-size:10px}.filters .on{background:#f5f6f9;color:#08090d;border-color:#f5f6f9;font-weight:900}.collection{margin-top:30px}.sectionHead{display:flex;justify-content:space-between;align-items:end;margin-bottom:11px}.sectionHead h2{font-size:21px;margin:4px 0 0;letter-spacing:-.035em}.sectionHead a{color:#a696ff;text-decoration:none;font-size:10px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.card{display:block;text-decoration:none;color:#fff;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:19px;background:rgba(255,255,255,.035);box-shadow:0 16px 50px rgba(0,0,0,.22)}.preview{position:relative;min-height:245px;background:radial-gradient(circle at 50% 40%,rgba(136,104,255,.2),transparent 56%),#080a10;overflow:hidden}.preview :global(canvas){display:block!important;width:100%!important;height:100%!important}.rarity,.badge{position:absolute;top:9px;border:1px solid rgba(255,255,255,.12);background:rgba(4,6,11,.7);backdrop-filter:blur(10px);border-radius:999px;padding:5px 7px;font-size:7px;font-weight:900;letter-spacing:.1em}.rarity{right:9px}.rarity.rare{color:#72dcff}.rarity.epic{color:#b39aff}.rarity.legendary{color:#ffd17a}.rarity.mythic{color:#ff9ce9}.badge{left:9px;top:auto;bottom:9px;color:#fff}.meta{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px}.meta small{display:block;color:#747e91;text-transform:uppercase;font-size:7px;letter-spacing:.1em}.meta h3{font-size:14px;margin:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta p{font-size:9px;color:#697286;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta strong{font-size:11px;white-space:nowrap}.meta i{font-style:normal;color:#727c8e;font-size:7px}.callout{margin-top:28px;padding:23px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:linear-gradient(135deg,rgba(143,112,255,.13),rgba(255,255,255,.025))}.callout h2{font-size:28px;line-height:.95;letter-spacing:-.05em;margin:9px 0 18px}.callout a{display:inline-block;background:#f5f6f9;color:#08090d;text-decoration:none;border-radius:12px;padding:10px 12px;font-size:10px;font-weight:900}.bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:20px}.bottom a{display:grid;place-items:center;gap:5px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035);color:#fff;text-decoration:none;font-size:18px}.bottom b{font-size:9px}.bottom a:first-child{color:#aa99ff}.bottom a:nth-child(2){color:#61e6ff}.bottom a:nth-child(3){color:#ffb3df}footer{display:flex;justify-content:center;gap:18px;margin-top:22px}footer a{color:#5f687a;text-decoration:none;font-size:9px}@media(min-width:760px){.home{padding-left:max(22px,calc((100vw - 1120px)/2));padding-right:max(22px,calc((100vw - 1120px)/2))}.grid{grid-template-columns:repeat(4,minmax(0,1fr))}.preview{min-height:260px}.hero{padding-top:55px}}@media(max-width:420px){.preview{min-height:220px}.hero h1{font-size:43px}}
      `}</style>
    </main>
  );
}

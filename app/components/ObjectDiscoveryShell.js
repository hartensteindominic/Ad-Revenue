'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogWindow } from '../../lib/catalog';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });
const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });

const FILTERS = ['All', 'Near me', 'Rare', 'Sponsored', 'Creators', '3D'];
const FALLBACK_FEATURED = getCatalogWindow(0, 6);

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const rad = value => (value * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function formatDistance(meters) {
  if (meters == null) return 'Location off';
  if (meters < 1000) return `${meters} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

function ObjectVisual({ item }) {
  const common = {
    seed: item?.seed || `object-${item?.id || item?.name || 'vault'}`,
    rarity: item?.rarity || 'Rare',
    material: item?.material || 'digital',
    compact: true,
    showcase: false,
    interactive: false,
    label: false,
  };

  return (
    <Lazy3DPreview minHeight={190}>
      {item?.renderMode === 'voxel' && item?.shape
        ? <VoxelViewer shape={item.shape} {...common} />
        : <ArtPreview family={item?.family || 'sculpture'} {...common} />}
    </Lazy3DPreview>
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
      .then(response => response.ok ? response.json() : Promise.reject(new Error('drop feed unavailable')))
      .then(data => { if (!cancelled) setDrops(Array.isArray(data?.drops) ? data.drops : []); })
      .catch(() => { if (!cancelled) setDrops([]); })
      .finally(() => { if (!cancelled) setLoadingDrops(false); });
    return () => { cancelled = true; };
  }, []);

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState('on');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const featured = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FALLBACK_FEATURED.filter(item => {
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material || ''}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const matchesFilter = filter === 'All' || filter === '3D' || (filter === 'Rare' && ['Rare', 'Epic', 'Mythic'].includes(item.rarity)) || (filter === 'Creators' && item.creator !== 'Voxel Vault');
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const nearby = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drops
      .map(drop => ({ ...drop, distance: distanceMeters(position, drop) }))
      .filter(drop => {
        const collectible = drop.collectible || {};
        const text = `${drop.name || ''} ${collectible.name || ''} ${collectible.family || ''} ${collectible.rarity || ''}`.toLowerCase();
        const matchesQuery = !q || text.includes(q);
        const isSponsored = Boolean(drop.sponsored || collectible.sponsored || drop.campaignId || collectible.campaignId);
        const matchesFilter = filter === 'All' || filter === 'Near me' || (filter === 'Rare' && ['rare', 'epic', 'mythic', 'Rare', 'Epic', 'Mythic'].includes(collectible.rarity)) || (filter === 'Sponsored' && isSponsored) || filter === '3D';
        return matchesQuery && matchesFilter && (position ? drop.distance != null && drop.distance <= 5000 : filter !== 'Near me');
      })
      .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 8);
  }, [drops, filter, position, query]);

  const showNearby = filter === 'Near me' || (position && nearby.length > 0);

  return (
    <section className="objectFinder" aria-labelledby="object-finder-title">
      <div className="finderGlow finderGlowOne" />
      <div className="finderGlow finderGlowTwo" />
      <div className="finderTopbar">
        <div className="finderBrand"><span>VV</span><strong>OBJECTS WORTH FINDING</strong></div>
        <button className={`locationChip ${locationState}`} type="button" onClick={useLocation} disabled={locationState === 'loading'}>
          <span className="locationDot" />
          {locationState === 'on' ? 'Near you' : locationState === 'loading' ? 'Locating…' : locationState === 'denied' ? 'Location blocked' : 'Set location'}
        </button>
      </div>

      <div className="finderIntro">
        <div>
          <div className="finderEyebrow">WALK · DISCOVER · COLLECT · EARN</div>
          <h2 id="object-finder-title">Find something <em>worth keeping.</em></h2>
          <p>Discover original 3D objects, see what is around you, and collect only when the Vault can verify the claim on-chain.</p>
        </div>
        <Link className="finderVaultLink" href="/discover">Open full discovery ↗</Link>
      </div>

      <div className="finderSearchRow">
        <label className="finderSearch">
          <span>⌕</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search objects, creators, worlds…" aria-label="Search objects" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
      </div>

      <div className="finderFilters" role="tablist" aria-label="Object filters">
        {FILTERS.map(name => (
          <button key={name} type="button" role="tab" aria-selected={filter === name} className={filter === name ? 'active' : ''} onClick={() => setFilter(name)}>{name}</button>
        ))}
      </div>

      {showNearby && (
        <div className="finderSection">
          <div className="finderSectionHead"><div><span className="finderLabel">NEARBY SIGNALS</span><h3>Objects around you</h3></div><span>{position ? 'Sorted by distance' : 'Enable location to sort'}</span></div>
          {nearby.length ? (
            <div className="finderRail">
              {nearby.map(drop => {
                const item = { ...drop.collectible, id: drop.id, name: drop.collectible?.name || drop.name };
                return (
                  <article className="objectCard nearbyCard" key={drop.id}>
                    <div className="objectMedia"><ObjectVisual item={item} /><span className="signalBadge">SIGNAL</span></div>
                    <div className="objectBody"><div><span className="objectRarity">{item.rarity || 'Common'}</span><h4>{item.name}</h4><p>{formatDistance(drop.distance)} · {drop.quantity ?? '—'} available</p></div><Link href={`/hunt?drop=${encodeURIComponent(drop.id)}`} className="objectAction">View object</Link></div>
                  </article>
                );
              })}
            </div>
          ) : <div className="finderEmpty">{loadingDrops ? 'Finding active signals…' : 'Nothing verified nearby yet. Keep exploring or browse the featured Vault.'}</div>}
        </div>
      )}

      <div className="finderSection">
        <div className="finderSectionHead"><div><span className="finderLabel">FEATURED IN THE VAULT</span><h3>Objects worth a closer look</h3></div><span>{featured.length} shown</span></div>
        <div className="finderRail">
          {featured.map(item => (
            <article className="objectCard" key={item.id}>
              <div className="objectMedia"><ObjectVisual item={item} /><span className={`rarityBadge ${String(item.rarity || '').toLowerCase()}`}>{item.rarity}</span></div>
              <div className="objectBody"><div><span className="objectRarity">{item.type || 'Digital Object'}</span><h4>{item.name}</h4><p>{item.creator || 'Voxel Vault'} · {item.price ? `${item.price} ETH` : 'Vault object'}</p></div><Link href="/#drops" className="objectAction">Inspect 3D</Link></div>
            </article>
          ))}
          {!featured.length && <div className="finderEmpty">No objects match that search.</div>}
        </div>
      </div>

      <div className="finderFooter">
        <span>Ownership is confirmed only after the verified chain receipt.</span>
        <div><Link href="/marketplace">Marketplace</Link><Link href="/trade">Trade</Link><Link href="/hunt">Collect</Link></div>
      </div>

      <style jsx>{`
        .objectFinder{position:relative;margin:18px auto 0;max-width:1380px;padding:0 5vw 34px;overflow:hidden}.finderGlow{position:absolute;border-radius:999px;filter:blur(70px);pointer-events:none}.finderGlowOne{width:320px;height:220px;right:-90px;top:20px;background:rgba(116,88,255,.13)}.finderGlowTwo{width:260px;height:220px;left:-100px;top:430px;background:rgba(30,205,255,.07)}
        .finderTopbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08)}.finderBrand{display:flex;align-items:center;gap:10px;min-width:0}.finderBrand span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#9b7cff,#4bd5ff);color:#080912;font-size:11px;font-weight:950}.finderBrand strong{font-size:11px;letter-spacing:.13em;color:#e7e9f4}.locationChip{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);border-radius:999px;padding:9px 13px;color:#dce0ed;font-size:12px;cursor:pointer}.locationChip.loading{opacity:.7}.locationDot{width:7px;height:7px;border-radius:50%;background:#777}.locationChip.on .locationDot{background:#65f0b0;box-shadow:0 0 12px rgba(101,240,176,.8)}
        .finderIntro{display:flex;align-items:end;justify-content:space-between;gap:28px;padding:30px 0 18px}.finderEyebrow,.finderLabel{font-size:10px;letter-spacing:.16em;color:#9f92ff;font-weight:850}.finderIntro h2{margin:8px 0 8px;font-size:clamp(28px,5vw,50px);line-height:.98;letter-spacing:-.04em}.finderIntro h2 em{font-style:normal;color:#9b7cff}.finderIntro p{max-width:650px;margin:0;color:#9ca4b7;line-height:1.65;font-size:14px}.finderVaultLink{white-space:nowrap;color:#e9eaf3;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.22);padding-bottom:3px;font-size:12px}
        .finderSearchRow{max-width:760px}.finderSearch{display:flex;align-items:center;gap:10px;min-height:50px;padding:0 14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.finderSearch>span{font-size:21px;color:#8f96a9}.finderSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:14px}.finderSearch input::placeholder{color:#737b8e}.finderSearch button{border:0;background:transparent;color:#8d95a8;font-size:20px;cursor:pointer}
        .finderFilters{display:flex;gap:8px;overflow:auto;padding:14px 0 6px;scrollbar-width:none}.finderFilters::-webkit-scrollbar{display:none}.finderFilters button{flex:0 0 auto;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:#9da4b6;border-radius:999px;padding:8px 13px;font-size:12px;cursor:pointer}.finderFilters button.active{background:#f1f2f7;color:#080912;border-color:#f1f2f7;font-weight:800}
        .finderSection{margin-top:24px}.finderSectionHead{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:11px}.finderSectionHead h3{margin:4px 0 0;font-size:19px;letter-spacing:-.02em}.finderSectionHead>span{color:#6f778a;font-size:11px}.finderRail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.objectCard{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:18px;overflow:hidden;min-width:0;transition:transform .2s ease,border-color .2s ease,background .2s ease}.objectCard:hover{transform:translateY(-2px);border-color:rgba(155,124,255,.36);background:rgba(255,255,255,.05)}.objectMedia{position:relative;min-height:190px;background:radial-gradient(circle at 50% 40%,rgba(122,98,255,.16),transparent 55%),#080a12}.objectMedia :global(canvas){display:block}.signalBadge,.rarityBadge{position:absolute;top:10px;left:10px;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900;letter-spacing:.08em;background:rgba(7,8,13,.72);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(10px)}.signalBadge{color:#65f0b0}.rarityBadge{left:auto;right:10px;color:#ddd}.rarityBadge.mythic{color:#ff9af7}.rarityBadge.epic{color:#b99cff}.rarityBadge.rare{color:#77d7ff}
        .objectBody{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:13px}.objectRarity{font-size:9px;text-transform:uppercase;letter-spacing:.11em;color:#8c94a7}.objectBody h4{margin:4px 0 2px;font-size:16px}.objectBody p{margin:0;color:#737c8f;font-size:11px}.objectAction{flex:0 0 auto;text-decoration:none;border:1px solid rgba(255,255,255,.11);border-radius:10px;padding:8px 10px;color:#eef0f7;font-size:11px}.finderEmpty{padding:24px;border:1px dashed rgba(255,255,255,.1);border-radius:15px;color:#7e879a;font-size:12px}.finderFooter{display:flex;justify-content:space-between;gap:16px;margin-top:24px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);color:#70788b;font-size:10px}.finderFooter div{display:flex;gap:15px}.finderFooter a{color:#a8afc0;text-decoration:none}
        @media (max-width:900px){.finderRail{grid-template-columns:repeat(2,minmax(0,1fr))}.finderIntro{align-items:start;flex-direction:column}.finderVaultLink{display:none}}
        @media (max-width:620px){.objectFinder{padding:0 16px 24px}.finderTopbar{padding:10px 0}.finderBrand strong{font-size:9px}.finderIntro{padding:24px 0 15px}.finderIntro h2{font-size:34px}.finderIntro p{font-size:13px}.finderRail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px;margin-right:-16px}.objectCard{flex:0 0 82vw;scroll-snap-align:start}.objectMedia{min-height:185px}.finderSectionHead h3{font-size:17px}.finderFooter{display:block}.finderFooter div{margin-top:10px}}
      `}</style>
    </section>
  );
}

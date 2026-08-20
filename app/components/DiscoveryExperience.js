'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createUniversalCollectible, validateUniversalCollectible, collectibleFingerprint } from '../../lib/universalCollectible';
import { createDrop, isDropDiscoverable, isWithinDropZone } from '../../lib/dropEngine';

const SAMPLE_DROPS = [
  {
    id: 'drop-field-camera-001',
    name: 'Field Camera Drop',
    status: 'active',
    quantity: 25,
    publicZoneId: 'central-park-south',
    radiusMeters: 120,
    lat: 40.7648,
    lng: -73.9808,
    startAt: new Date(Date.now() - 86400000).toISOString(),
    endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    collectibleInput: {
      name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001',
      realityBasis: { inspiredBy: 'vintage field camera', plausibility: 'realistic' },
    },
  },
  {
    id: 'drop-survey-robot-001',
    name: 'Survey Robot Drop',
    status: 'active',
    quantity: 10,
    publicZoneId: 'union-square',
    radiusMeters: 90,
    lat: 40.7359,
    lng: -73.9911,
    startAt: new Date(Date.now() - 3600000).toISOString(),
    endAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    collectibleInput: {
      name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001',
      realityBasis: { inspiredBy: 'industrial inspection robot', plausibility: 'realistic' },
    },
  },
  {
    id: 'drop-street-deck-001',
    name: 'Street Deck Drop',
    status: 'active',
    quantity: 40,
    publicZoneId: 'venice-boardwalk',
    radiusMeters: 150,
    lat: 33.985,
    lng: -118.4695,
    startAt: new Date(Date.now() - 7200000).toISOString(),
    endAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    collectibleInput: {
      name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001',
      realityBasis: { inspiredBy: 'modern skateboard', plausibility: 'realistic' },
    },
  },
];

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function loadPlacedDrops() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem('voxel-vault-placed-drops') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function savePlacedDrops(list) {
  try { window.localStorage.setItem('voxel-vault-placed-drops', JSON.stringify(list.slice(-20))); } catch { /* ignore */ }
}

export default function DiscoveryExperience() {
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDropId, setSelectedDropId] = useState(null);
  const [wallet, setWallet] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [lastTicket, setLastTicket] = useState('');
  const [placedDrops, setPlacedDrops] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [placeForm, setPlaceForm] = useState({ name: '', radiusMeters: 80, quantity: 10, family: 'technology', subtype: 'object' });

  useEffect(() => { setPlacedDrops(loadPlacedDrops()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) savePlacedDrops(placedDrops); }, [placedDrops, hydrated]);

  const drops = useMemo(() => {
    const built = SAMPLE_DROPS.map((raw) => {
      const drop = createDrop({
        id: raw.id, name: raw.name, status: raw.status, quantity: raw.quantity,
        publicZoneId: raw.publicZoneId, radiusMeters: raw.radiusMeters, startAt: raw.startAt, endAt: raw.endAt,
      });
      const collectible = createUniversalCollectible(raw.collectibleInput);
      return { ...drop, lat: raw.lat, lng: raw.lng, collectible, fingerprint: collectibleFingerprint(collectible), validation: validateUniversalCollectible(collectible) };
    });
    return [...built, ...placedDrops];
  }, [placedDrops]);

  const selected = drops.find((d) => d.id === selectedDropId) || null;
  const distanceToSelected = useMemo(() => {
    if (!position || !selected) return null;
    return haversineMeters(position.lat, position.lng, selected.lat, selected.lng);
  }, [position, selected]);

  const nearby = useMemo(() => {
    if (!position) return [];
    return drops
      .map((d) => ({ ...d, distance: haversineMeters(position.lat, position.lng, d.lat, d.lng) }))
      .filter((d) => d.distance <= (d.discovery?.radiusMeters || 100) * 4)
      .sort((a, b) => a.distance - b.distance);
  }, [position, drops]);

  const requestLocation = useCallback(() => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('Location unlocked. Public drops near you will light up.');
      },
      (err) => {
        setGeoError(err?.code === 1 ? 'Location permission denied. You can still browse sample drops.' : (err?.message || 'Could not read location.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(requestLocation, 800);
    return () => clearTimeout(t);
  }, [requestLocation]);

  async function connectWallet() {
    try {
      if (typeof window === 'undefined' || !window.ethereum) throw new Error('Wallet not detected. Use MetaMask or a compatible wallet.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts?.[0] || '');
      setStatus(accounts?.[0] ? `Wallet connected ${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}` : 'Connection cancelled');
    } catch (e) {
      setStatus(e?.message || 'Wallet connection failed');
    }
  }

  async function handleClaim() {
    if (!selected) { setStatus('Select a drop first.'); return; }
    if (!wallet) { setStatus('Connect a wallet before claiming.'); return; }
    setClaiming(true);
    setLastTicket('');
    try {
      const distance = distanceToSelected ?? null;
      const response = await fetch('/api/drops/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropId: selected.id,
          walletAddress: wallet,
          distanceMeters: distance,
          requireInZone: false, // UX distance is not proof; server still authorizes ticket + replay rules
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Claim denied (${response.status})`);
      }
      setLastTicket(data.claimTicket || '');
      setStatus(
        data.ownershipGranted
          ? 'Unexpected: server reported ownership — verify on-chain before trusting this.'
          : `Server authorized claim ticket for ${selected.collectible?.name || selected.name}. ` +
            `Ticket ${String(data.claimTicket || '').slice(0, 18)}… ` +
            `Ownership is NOT granted until a wallet transaction confirms on-chain. ` +
            `(storage: ${data.storage || 'server'})`
      );
    } catch (e) {
      setStatus(e?.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  }

  async function placeDrop(e) {
    e.preventDefault();
    if (!position) {
      setStatus('Enable location so the drop can be anchored to a public zone near you.');
      return;
    }
    try {
      const payload = {
        name: placeForm.name || 'Local Voxel Drop',
        status: 'active',
        quantity: Number(placeForm.quantity) || 10,
        publicZoneId: 'user-public-zone',
        radiusMeters: Number(placeForm.radiusMeters) || 80,
        lat: position.lat + (Math.random() - 0.5) * 0.004,
        lng: position.lng + (Math.random() - 0.5) * 0.004,
        family: placeForm.family,
        subtype: placeForm.subtype || 'object',
      };
      const response = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not place drop');

      const drop = data.drop;
      const collectible = drop.collectible || createUniversalCollectible({
        name: payload.name, family: payload.family, subtype: payload.subtype, rarity: 'common', seed: drop.id,
      });
      const entry = {
        ...createDrop({
          id: drop.id,
          name: drop.name,
          status: drop.status || 'active',
          quantity: drop.quantity,
          publicZoneId: drop.discovery?.publicZoneId,
          radiusMeters: drop.discovery?.radiusMeters,
          startAt: drop.schedule?.startAt,
          endAt: drop.schedule?.endAt,
        }),
        lat: drop.lat,
        lng: drop.lng,
        collectible,
        fingerprint: collectibleFingerprint(collectible),
        validation: validateUniversalCollectible(collectible),
      };
      setPlacedDrops((prev) => [...prev, entry]);
      setSelectedDropId(drop.id);
      setShowPlaceForm(false);
      setStatus(`Drop “${drop.name}” registered with server. Others can discover it when storage is shared (Supabase).`);
    } catch (err) {
      setStatus(err?.message || 'Could not place drop');
    }
  }

  const mapCenter = position || { lat: 40.75, lng: -73.98 };
  const project = (lat, lng) => {
    const scale = 18000;
    const x = 50 + (lng - mapCenter.lng) * scale;
    const y = 50 - (lat - mapCenter.lat) * scale;
    return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) };
  };

  return (
    <main className="discoveryRoot">
      <nav className="discNav">
        <Link className="brand" href="/">V<span>V</span>OXELVAULT</Link>
        <div className="navLinks">
          <Link href="/">Gallery</Link>
          <Link href="/discover" className="active">Discover</Link>
          <Link href="/trade">Trade</Link>
          <Link href="/marketplace">Marketplace</Link>
        </div>
        <button type="button" className="walletBtn" onClick={connectWallet}>
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect Wallet'}
        </button>
      </nav>

      <header className="discHero">
        <div>
          <div className="eyebrow"><i /> REAL-WORLD DROPS · SERVER-AUTHORIZED CLAIMS</div>
          <h1>Find them <em>out there.</em></h1>
          <p>
            Public Voxel Drops appear in real places. Claim hits the server for authorization and replay protection.
            Location is UX only. Ownership requires a later wallet transaction and chain confirmation.
          </p>
          <div className="heroActions">
            <button type="button" className="primary" onClick={requestLocation}>Enable location</button>
            <button type="button" className="secondary" onClick={() => setShowPlaceForm((v) => !v)}>
              {showPlaceForm ? 'Cancel placement' : 'Place a drop near me'}
            </button>
          </div>
        </div>
        <div className="mapCard">
          <div className="mapCanvas" aria-label="Discovery map">
            {drops.map((d) => {
              const { x, y } = project(d.lat, d.lng);
              const active = selectedDropId === d.id;
              return (
                <button key={d.id} type="button" className={`pin ${active ? 'active' : ''} ${isDropDiscoverable(d) ? 'live' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setSelectedDropId(d.id)} title={d.name}>
                  <span className="pinDot" /><span className="pinLabel">{d.collectible?.name || d.name}</span>
                </button>
              );
            })}
            {position && (() => {
              const { x, y } = project(position.lat, position.lng);
              return <div className="you" style={{ left: `${x}%`, top: `${y}%` }} title="You"><span /></div>;
            })()}
            <div className="mapGrid" />
          </div>
          <div className="mapMeta">
            {position ? `Your position · ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Location off — enable to see nearby drops'}
            {geoError && <span className="err"> · {geoError}</span>}
          </div>
        </div>
      </header>

      {showPlaceForm && (
        <form className="placeForm" onSubmit={placeDrop}>
          <h3>Place a public drop</h3>
          <p>Registers the drop with the server API (Supabase when configured, otherwise ephemeral memory).</p>
          <div className="fields">
            <label>Name<input value={placeForm.name} onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })} placeholder="Neon Compass" required /></label>
            <label>Family
              <select value={placeForm.family} onChange={(e) => setPlaceForm({ ...placeForm, family: e.target.value })}>
                <option value="technology">technology</option>
                <option value="sports">sports</option>
                <option value="vehicles">vehicles</option>
                <option value="creatures">creatures</option>
                <option value="artifacts">artifacts</option>
              </select>
            </label>
            <label>Radius (m)<input type="number" min={20} max={500} value={placeForm.radiusMeters} onChange={(e) => setPlaceForm({ ...placeForm, radiusMeters: e.target.value })} /></label>
            <label>Quantity<input type="number" min={1} max={1000} value={placeForm.quantity} onChange={(e) => setPlaceForm({ ...placeForm, quantity: e.target.value })} /></label>
          </div>
          <button type="submit" className="primary">Drop it in the wild</button>
        </form>
      )}

      <section className="nearbySection">
        <div className="sectionHead">
          <div><div className="eyebrow">NEAR YOU</div><h2>Drops in range</h2></div>
          <p>{nearby.length ? `${nearby.length} public zone(s) within extended range` : 'Walk closer or enable location — sample drops still listed below'}</p>
        </div>
        <div className="dropList">
          {(nearby.length ? nearby : drops).map((d) => {
            const dist = d.distance ?? (position ? haversineMeters(position.lat, position.lng, d.lat, d.lng) : null);
            const inZone = dist != null && isWithinDropZone(d, dist);
            return (
              <article key={d.id} className={`dropCard ${selectedDropId === d.id ? 'selected' : ''} ${inZone ? 'inZone' : ''}`} onClick={() => setSelectedDropId(d.id)} onKeyDown={(e) => e.key === 'Enter' && setSelectedDropId(d.id)} role="button" tabIndex={0}>
                <div className="dropTop">
                  <span className="liveDot">{isDropDiscoverable(d) ? '● LIVE' : '○ OFF'}</span>
                  <strong>{d.collectible?.name || d.name}</strong>
                  <span className="rarity">{d.collectible?.rarity}</span>
                </div>
                <p>{d.name} · {d.discovery?.publicZoneId || 'public zone'}</p>
                <div className="dropMeta">
                  <span>{dist != null ? `${Math.round(dist)} m` : '—'}</span>
                  <span>qty {d.quantity}</span>
                  <span>r {d.discovery?.radiusMeters} m</span>
                  {inZone && <span className="claimable">IN ZONE</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="inspectPanel">
          <div className="inspectInner">
            <div>
              <div className="eyebrow">VOXEL DROP · {(selected.collectible?.rarity || 'common').toUpperCase()}</div>
              <h2>{selected.collectible?.name}</h2>
              <p>{selected.collectible?.realityBasis?.inspiredBy || selected.name}. Family: {selected.collectible?.family}</p>
              <div className="stats">
                <span>Zone radius <b>{selected.discovery?.radiusMeters} m</b></span>
                <span>Your distance <b>{distanceToSelected != null ? `${Math.round(distanceToSelected)} m` : 'unknown'}</b></span>
                <span>Discoverable <b>{isDropDiscoverable(selected) ? 'yes' : 'no'}</b></span>
                <span>In zone <b>{distanceToSelected != null && isWithinDropZone(selected, distanceToSelected) ? 'yes' : 'no'}</b></span>
              </div>
              <div className="actions">
                <button type="button" className="primary" onClick={handleClaim} disabled={claiming || !wallet}>
                  {claiming ? 'Authorizing…' : wallet ? 'Request claim ticket' : 'Connect wallet to claim'}
                </button>
                <Link className="secondary" href={`/trade?mode=create&object=${encodeURIComponent(selected.collectible?.name || '')}`}>Offer to trade →</Link>
              </div>
              <p className="securityNote">
                This calls <strong>/api/drops/claim</strong>. A successful response is a <strong>claim ticket</strong>, not ownership.
                {lastTicket ? ` Last ticket: ${lastTicket.slice(0, 22)}…` : ''}
              </p>
            </div>
          </div>
        </section>
      )}

      {status && (
        <div className="statusBar"><span>●</span>{status}<button type="button" onClick={() => setStatus('')}>×</button></div>
      )}

      <style jsx>{`
        .discoveryRoot{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .discNav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:40}
        .brand{font-size:16px;font-weight:950;letter-spacing:.14em;text-decoration:none;color:#fff}.brand span{color:#9b7cff}
        .navLinks{display:flex;gap:22px;font-size:13px}.navLinks a{color:#9da3b5;text-decoration:none}.navLinks a.active,.navLinks a:hover{color:#fff}
        .walletBtn{border:1px solid rgba(255,255,255,.14);background:#0b0d15;border-radius:999px;padding:10px 14px;color:#fff;font-weight:800;cursor:pointer}
        .discHero{max-width:1400px;margin:0 auto;padding:48px 5vw 24px;display:grid;grid-template-columns:1.05fr .95fr;gap:32px;align-items:center}
        .eyebrow{font-size:10px;letter-spacing:.18em;color:#8e95aa;font-weight:850;margin-bottom:14px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}
        .discHero h1{font-size:clamp(42px,6vw,78px);line-height:.92;letter-spacing:-.05em;margin:0 0 16px;font-weight:950}
        .discHero h1 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}
        .discHero p{color:#a7adbe;line-height:1.65;max-width:560px;font-size:15px}
        .heroActions{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}
        .primary,.secondary{border-radius:999px;padding:12px 18px;font-weight:850;cursor:pointer;border:1px solid transparent;text-decoration:none;display:inline-flex;align-items:center}
        .primary{background:#fff;color:#07080c;border-color:#fff}.secondary{background:#0b0d15;color:#e7e2ff;border-color:rgba(155,124,255,.35)}
        .mapCard{border:1px solid rgba(255,255,255,.1);border-radius:24px;overflow:hidden;background:#080a12;box-shadow:0 24px 80px rgba(0,0,0,.35)}
        .mapCanvas{position:relative;height:340px;background:radial-gradient(circle at 50% 45%,rgba(85,230,255,.08),transparent 50%),linear-gradient(160deg,#0a0d16,#05060b)}
        .mapGrid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
        .pin{position:absolute;transform:translate(-50%,-50%);background:transparent;border:0;cursor:pointer;z-index:2}
        .pinDot{display:block;width:14px;height:14px;border-radius:50%;background:#9b7cff;box-shadow:0 0 18px #9b7cff;border:2px solid #fff}
        .pin.live .pinDot{background:#55e6ff;box-shadow:0 0 18px #55e6ff}.pin.active .pinDot{transform:scale(1.35);background:#fff}
        .pinLabel{position:absolute;left:50%;top:18px;transform:translateX(-50%);white-space:nowrap;font-size:9px;font-weight:800;letter-spacing:.06em;color:#d9dceb;background:rgba(5,6,11,.8);padding:3px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.1)}
        .you{position:absolute;transform:translate(-50%,-50%);z-index:3}.you span{display:block;width:16px;height:16px;border-radius:50%;background:#55e6ff;border:3px solid #fff;box-shadow:0 0 22px #55e6ff}
        .mapMeta{padding:10px 14px;font-size:11px;color:#7f879b;border-top:1px solid rgba(255,255,255,.07)}.mapMeta .err{color:#ff8f8f}
        .placeForm{max-width:900px;margin:12px auto 0;padding:22px;border:1px solid rgba(155,124,255,.25);border-radius:20px;background:rgba(12,10,22,.95)}
        .placeForm h3{margin:0 0 6px}.placeForm p{margin:0 0 14px;color:#969db0;font-size:13px}
        .fields{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .fields label{display:grid;gap:5px;font-size:10px;letter-spacing:.1em;color:#8f97ad}
        .fields input,.fields select{background:#090b12;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px;color:#fff}
        .nearbySection{max-width:1400px;margin:0 auto;padding:40px 5vw 80px}
        .sectionHead{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px}.sectionHead h2{margin:0;font-size:clamp(28px,4vw,42px)}.sectionHead p{color:#7f879b;font-size:13px}
        .dropList{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .dropCard{padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:18px;background:rgba(255,255,255,.02);cursor:pointer;transition:.15s}
        .dropCard:hover,.dropCard.selected{border-color:rgba(155,124,255,.45);background:rgba(155,124,255,.06)}
        .dropCard.inZone{box-shadow:0 0 0 1px rgba(85,230,255,.35)}
        .dropTop{display:flex;align-items:center;gap:8px;margin-bottom:6px}.dropTop strong{flex:1}.liveDot{font-size:9px;color:#55e6ff;font-weight:900;letter-spacing:.1em}.rarity{font-size:10px;text-transform:uppercase;color:#c0b0ff}
        .dropCard p{margin:0 0 10px;color:#8a91a5;font-size:12px}
        .dropMeta{display:flex;gap:10px;font-size:11px;color:#6f7587}.claimable{color:#55e6ff;font-weight:800}
        .inspectPanel{position:sticky;bottom:0;background:linear-gradient(180deg,transparent,rgba(5,6,11,.96) 20%);padding:20px 5vw 28px;border-top:1px solid rgba(255,255,255,.08)}
        .inspectInner{max-width:1400px;margin:0 auto;padding:22px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(8,10,17,.96)}
        .inspectPanel h2{margin:6px 0 10px;font-size:clamp(28px,4vw,48px)}.inspectPanel p{color:#a0a6b8;line-height:1.6}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.stats span{font-size:11px;color:#7f879b}.stats b{display:block;color:#fff;margin-top:3px}
        .actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}.securityNote{font-size:12px;color:#7a8195;margin:0}
        .statusBar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:80;background:#11141e;border:1px solid rgba(255,255,255,.14);padding:11px 14px;border-radius:999px;display:flex;align-items:center;gap:9px;font-size:12px;max-width:min(920px,94vw);box-shadow:0 18px 50px rgba(0,0,0,.45)}.statusBar span{color:#9b7cff}.statusBar button{border:0;background:transparent;color:#8e94a7;cursor:pointer;font-size:16px}
        @media(max-width:900px){.discHero{grid-template-columns:1fr}.navLinks{display:none}.fields{grid-template-columns:1fr 1fr}.dropList{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.mapCanvas{height:280px}}
      `}</style>
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const rad = (v) => (v * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function ObjectsWorthFindingExperience() {
  const [objects, setObjects] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hunts')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to load nearby objects');
        if (!cancelled) setObjects(data.hunts || []);
      })
      .catch((error) => !cancelled && setStatus(error.message || 'Unable to load nearby objects'))
      .finally(() => !cancelled && setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => !cancelled && setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => !cancelled && setStatus('Location is optional. You can still explore the object catalog.'),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
      );
    }
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => objects
    .map((object) => {
      const coords = Number.isFinite(object.lat) && Number.isFinite(object.lng)
        ? { lat: object.lat, lng: object.lng }
        : null;
      return { ...object, distance: distanceMeters(position, coords) };
    })
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    }), [objects, position]);

  return (
    <main className="objectsRoot">
      <nav className="objectsNav">
        <Link className="brand" href="/">V<span>V</span>OXELVAULT</Link>
        <div className="links">
          <Link href="/discover">Discover</Link>
          <Link href="/objects-worth-finding" className="active">Objects Worth Finding</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/trade">Trade</Link>
        </div>
        <Link className="pill" href="/play">Play</Link>
      </nav>

      <header className="hero">
        <div className="eyebrow"><i /> WALK · DISCOVER · COLLECT · EARN</div>
        <h1>Objects worth <em>finding.</em></h1>
        <p>Real-world discovery for digital objects with real ownership. Walk toward a signal, get close, collect explicitly, and let the Vault handle the blockchain underneath.</p>
        <div className="actions">
          <Link className="primary" href="/hunt">Open collection experience</Link>
          <Link className="secondary" href="/discover">Explore the Atlas</Link>
        </div>
      </header>

      <section className="signalBar">
        <div><span className="dot" /> {position ? 'LOCATION READY' : 'LOCATION OPTIONAL'}</div>
        <strong>{loading ? 'Scanning the object catalog…' : `${ranked.length} objects available`}</strong>
      </section>

      <section className="grid">
        {!loading && ranked.length === 0 && <div className="empty">No objects are currently published. Check back when the next drop appears.</div>}
        {ranked.map((object, index) => (
          <article className={`card ${index === 0 && object.distance != null ? 'near' : ''}`} key={object.id || object.name}>
            <div className="cardTop">
              <span>{object.mode || 'NATURAL'}</span>
              <span>{object.active ? 'LIVE' : 'STANDBY'}</span>
            </div>
            <div className="glyph">✦</div>
            <h2>{object.name || 'Unnamed Object'}</h2>
            <p>{object.description || 'A collectible signal waiting to be discovered.'}</p>
            <div className="meta">
              <span>{object.difficulty || 'STANDARD'}</span>
              <span>{object.stopCount || object.stops?.length || 1} collection point{(object.stopCount || object.stops?.length || 1) === 1 ? '' : 's'}</span>
              <span>{object.distance != null ? `${Math.round(object.distance)} m away` : 'Distance hidden until you approach'}</span>
            </div>
            <Link className="cardAction" href="/hunt">View object →</Link>
          </article>
        ))}
      </section>

      <section className="promise">
        <div>
          <div className="eyebrow">THE COLLECTION RULE</div>
          <h2>Close enough to discover.<br /><em>Never close enough to fake ownership.</em></h2>
        </div>
        <div className="steps">
          <span><b>01</b> SIGNED PROXIMITY</span>
          <span><b>02</b> DURABLE RESERVATION</span>
          <span><b>03</b> SUBMITTED TRANSACTION</span>
          <span><b>04</b> VERIFIED CHAIN RECEIPT</span>
          <span><b>05</b> ATOMIC CONFIRMATION</span>
        </div>
      </section>

      {status && <div className="status">● {status}<button type="button" onClick={() => setStatus('')}>×</button></div>}

      <style jsx>{`
        .objectsRoot{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.objectsRoot *{box-sizing:border-box}
        .objectsNav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.88);backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}.brand{font-size:17px;font-weight:950;letter-spacing:.15em;color:#fff;text-decoration:none}.brand span{color:#9b7cff}.links{display:flex;gap:22px}.links a{font-size:12px;color:#9299ab;text-decoration:none}.links a:hover,.links a.active{color:#fff}.pill{border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:10px 15px;color:#fff;text-decoration:none;font-size:12px;font-weight:850}
        .hero{max-width:1120px;margin:auto;padding:82px 5vw 42px}.eyebrow{font-size:10px;letter-spacing:.18em;color:#8f96a9;font-weight:900}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}.hero h1{font-size:clamp(52px,8vw,96px);line-height:.9;letter-spacing:-.055em;margin:15px 0 20px;font-weight:950}.hero h1 em,.promise h2 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}.hero p{max-width:700px;color:#a8aec0;line-height:1.7;font-size:16px}.actions{display:flex;gap:10px;margin-top:28px;flex-wrap:wrap}.primary,.secondary{padding:13px 18px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:850}.primary{background:#fff;color:#05060b}.secondary{border:1px solid rgba(255,255,255,.16);color:#fff}
        .signalBar{max-width:1120px;margin:auto;padding:15px 5vw;display:flex;justify-content:space-between;gap:15px;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);color:#8e95a8;font-size:10px;letter-spacing:.1em}.signalBar strong{color:#d7dbea;letter-spacing:0}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 10px #55e6ff;margin-right:7px}
        .grid{max-width:1120px;margin:auto;padding:26px 5vw 78px;display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.card{min-height:300px;padding:20px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012));position:relative;overflow:hidden}.card.near{border-color:rgba(85,230,255,.35);box-shadow:inset 0 0 45px rgba(85,230,255,.035)}.cardTop{display:flex;justify-content:space-between;font-size:9px;letter-spacing:.14em;color:#7f879b}.glyph{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;margin:28px 0 16px;border:1px solid rgba(155,124,255,.3);background:radial-gradient(circle,rgba(155,124,255,.18),transparent 68%);color:#55e6ff;font-size:24px}.card h2{font-size:25px;margin:0 0 8px}.card p{font-size:12px;line-height:1.55;color:#9299ab;min-height:58px}.meta{display:flex;gap:7px;flex-wrap:wrap;margin:15px 0}.meta span{font-size:9px;color:#aeb4c5;border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:5px 7px}.cardAction{display:inline-block;margin-top:5px;color:#fff;text-decoration:none;font-size:12px;font-weight:850}.empty{grid-column:1/-1;padding:60px 20px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:20px;color:#7f879b}
        .promise{max-width:1120px;margin:0 auto 80px;padding:28px;border-radius:24px;border:1px solid rgba(85,230,255,.18);background:radial-gradient(circle at 85% 20%,rgba(85,230,255,.07),transparent 35%),rgba(7,10,17,.9);display:grid;grid-template-columns:1.1fr .9fr;gap:35px}.promise h2{font-size:31px;line-height:1.05;margin:10px 0}.steps{display:grid;gap:7px}.steps span{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:10px;letter-spacing:.09em;color:#a9afc0}.steps b{color:#55e6ff;margin-right:10px}.status{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;max-width:94vw;background:#11141e;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:11px 14px;color:#cdd2df;font-size:12px}.status button{border:0;background:transparent;color:#8e94a7;margin-left:8px;cursor:pointer}
        @media(max-width:900px){.grid{grid-template-columns:1fr 1fr}.promise{grid-template-columns:1fr}.links{display:none}}@media(max-width:600px){.grid{grid-template-columns:1fr}.hero{padding-top:60px}.signalBar{align-items:flex-start;flex-direction:column}.card{min-height:270px}}
      `}</style>
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'voxel-vault-spots-v1';

function loadSpots() {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveSpots(spots) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spots.slice(-12)));
  } catch {
    // Local-only enhancement. Never block the core app if storage is unavailable.
  }
}

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const radius = 6371000;
  const rad = (v) => (v * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function VaultSpotsExperience() {
  const [spots, setSpots] = useState([]);
  const [position, setPosition] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('Choose a place you return to and make it a Vault Spot.');
  const [locating, setLocating] = useState(false);
  const [name, setName] = useState('My Favorite Spot');
  const [kind, setKind] = useState('favorite');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => setSpots(loadSpots()), []);
  useEffect(() => saveSpots(spots), [spots]);

  const nearest = useMemo(() => {
    if (!position) return null;
    return spots
      .map((spot) => ({ ...spot, distance: distanceMeters(position, spot) }))
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }, [position, spots]);

  function unlockLocation() {
    if (!navigator.geolocation) {
      setStatus('This browser does not provide location services. Your spots can still be browsed.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude };
        setPosition(next);
        setLocating(false);
        const spot = spots
          .map((item) => ({ ...item, distance: distanceMeters(next, item) }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (spot && spot.distance <= spot.radiusMeters) {
          setSelected(spot.id);
          setStatus(`Vault Spot detected. ${spot.name} is ${Math.round(spot.distance)}m away.`);
        } else {
          setStatus('Location unlocked. Your Vault Spots are now checking in around you.');
        }
      },
      (error) => {
        setLocating(false);
        setStatus(error?.code === 1 ? 'Location permission was denied. Nothing was stored or shared.' : 'Could not read your location. Try again when location services are available.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function createSpot(event) {
    event.preventDefault();
    if (!position) {
      setStatus('Unlock your location first so this spot is anchored where you are.');
      return;
    }
    const spot = {
      id: `spot-${Date.now()}`,
      name: name.trim() || 'My Vault Spot',
      kind,
      lat: position.lat,
      lng: position.lng,
      radiusMeters: 90,
      createdAt: new Date().toISOString(),
      collectibles: 0,
      status: 'local-anchor',
    };
    setSpots((current) => [...current, spot]);
    setSelected(spot.id);
    setShowCreate(false);
    setStatus(`${spot.name} is ready. Return here to unlock its experience.`);
  }

  function openSpot(spot) {
    setSelected(spot.id);
    if (!position) {
      setStatus(`${spot.name} is saved. Unlock location when you return to see if you're inside its radius.`);
      return;
    }
    const distance = distanceMeters(position, spot);
    setStatus(distance <= spot.radiusMeters ? `${spot.name} unlocked. Your virtual Vault is here.` : `${spot.name} is ${Math.round(distance)}m away. Come back to unlock it.`);
  }

  const active = spots.find((spot) => spot.id === selected) || nearest;
  const activeDistance = active && position ? distanceMeters(position, active) : null;
  const unlocked = Boolean(active && activeDistance !== null && activeDistance <= active.radiusMeters);

  return (
    <main className="vaultSpotsPage">
      <section className="spotsHero">
        <div className="spotsCopy">
          <div className="spotsEyebrow"><span /> PHYSICAL WORLD · YOUR VIRTUAL VAULT</div>
          <h1>Leave your Vault <em>somewhere.</em></h1>
          <p className="spotsLead">Pick a place you love. Come back later. Your Voxel Vault experience waits there.</p>
          <div className="spotsActions">
            <button className="spotsPrimary" onClick={unlockLocation} disabled={locating}>{locating ? 'LOCATING…' : '⌖ UNLOCK MY LOCATION'}</button>
            <button className="spotsSecondary" onClick={() => setShowCreate((value) => !value)}>{showCreate ? 'CANCEL' : '+ CREATE VAULT SPOT'}</button>
          </div>
          <p className="spotsStatus" role="status">{status}</p>
          <div className="trustRow"><span>🔐 Wallet ownership stays on-chain</span><span>📍 Location stays local in this first release</span></div>
        </div>

        <div className={`spotPortal ${unlocked ? 'unlocked' : ''}`}>
          <div className="portalOrbit orbitOne" /><div className="portalOrbit orbitTwo" />
          <div className="portalCore">
            <div className="portalGlyph">VV</div>
            <strong>{unlocked ? 'VAULT UNLOCKED' : 'VAULT SPOT'}</strong>
            <span>{active ? active.name : 'Choose your first spot'}</span>
            {active && <small>{activeDistance === null ? 'Location check off' : `${Math.round(activeDistance)}m away`}</small>}
          </div>
        </div>
      </section>

      {showCreate && (
        <form className="spotCreate" onSubmit={createSpot}>
          <div><span className="cardEyebrow">CREATE A SPOT</span><h2>Give this place a name.</h2><p>The first Vault Spots release uses your device's local storage. It does not pretend the location is an on-chain custody layer.</p></div>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Home Base" /></label>
          <label>Type<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="home">🏠 Home</option><option value="work">💼 Work</option><option value="favorite">⭐ Favorite</option><option value="hunt">🎯 Hunt</option><option value="secret">🔐 Secret</option><option value="travel">🌎 Travel</option></select></label>
          <button className="spotsPrimary" type="submit">SAVE THIS SPOT</button>
        </form>
      )}

      <section className="spotsGridSection">
        <div className="sectionHead"><div><span className="cardEyebrow">YOUR MAP</span><h2>Vault Spots</h2></div><span className="spotCount">{spots.length} saved</span></div>
        {spots.length === 0 ? (
          <div className="emptySpot"><div className="emptyIcon">⌖</div><h3>Your world is empty.</h3><p>Unlock your location and create your first Vault Spot. Later, this is where your collectibles can appear when you return.</p><button className="spotsSecondary" onClick={unlockLocation}>FIND ME</button></div>
        ) : (
          <div className="spotCards">
            {spots.map((spot) => {
              const distance = position ? distanceMeters(position, spot) : null;
              const isUnlocked = distance !== null && distance <= spot.radiusMeters;
              return (
                <button key={spot.id} className={`spotCard ${selected === spot.id ? 'selected' : ''}`} onClick={() => openSpot(spot)}>
                  <span className="spotCardIcon">{spot.kind === 'home' ? '🏠' : spot.kind === 'work' ? '💼' : spot.kind === 'hunt' ? '🎯' : spot.kind === 'secret' ? '🔐' : spot.kind === 'travel' ? '🌎' : '⭐'}</span>
                  <span className="spotCardBody"><b>{spot.name}</b><small>{spot.collectibles} collectibles · {distance === null ? 'location off' : isUnlocked ? 'UNLOCKED HERE' : `${Math.round(distance)}m away`}</small></span>
                  <span className="spotCardArrow">{isUnlocked ? 'OPEN' : '→'}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="spotsRules"><div><span className="cardEyebrow">HOW IT WORKS</span><h2>The spot is the doorway. Your wallet is still the vault.</h2></div><div className="rule"><b>01</b><span><strong>Pick a place</strong><small>Create a personal location anchor on your phone.</small></span></div><div className="rule"><b>02</b><span><strong>Place collectibles</strong><small>Future versions can associate owned NFTs with the spot.</small></span></div><div className="rule"><b>03</b><span><strong>Come back</strong><small>Return inside the radius and the portal unlocks.</small></span></div><div className="rule"><b>04</b><span><strong>Own for real</strong><small>Blockchain ownership never depends on your physical location.</small></span></div></section>
    </main>
  );
}

<style jsx>{`
.vaultSpotsPage{min-height:100vh;padding:0 clamp(16px,5vw,72px) 100px;background:radial-gradient(circle at 78% 16%,rgba(124,58,237,.16),transparent 34%),radial-gradient(circle at 15% 65%,rgba(59,130,246,.08),transparent 30%),#05060b;color:#f7f7ff}.spotsHero{max-width:1260px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(30px,6vw,90px);align-items:center;padding:clamp(60px,9vw,110px) 0 70px}.spotsEyebrow,.cardEyebrow{display:flex;align-items:center;gap:8px;color:#9c8cff;font-size:10px;font-weight:900;letter-spacing:.18em}.spotsEyebrow span{width:7px;height:7px;border-radius:50%;background:#a78bfa;box-shadow:0 0 18px #8b5cf6}.spotsCopy h1{margin:16px 0 14px;font-size:clamp(46px,7vw,92px);line-height:.92;letter-spacing:-.06em;max-width:760px}.spotsCopy h1 em{font-style:normal;color:#a78bfa}.spotsLead{max-width:620px;color:#a5aabd;font-size:clamp(16px,2vw,21px);line-height:1.55}.spotsActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.spotsPrimary,.spotsSecondary{border:0;border-radius:14px;padding:13px 17px;font-weight:900;font-size:11px;letter-spacing:.08em;cursor:pointer}.spotsPrimary{color:white;background:linear-gradient(135deg,#8b5cf6,#5b21b6);box-shadow:0 12px 34px rgba(109,40,217,.25)}.spotsPrimary:disabled{opacity:.55;cursor:wait}.spotsSecondary{color:#eee;background:#0c0f19;border:1px solid rgba(255,255,255,.12)}.spotsStatus{min-height:22px;margin-top:16px;color:#c4b5fd;font-size:12px}.trustRow{display:flex;gap:14px;flex-wrap:wrap;margin-top:18px;color:#70778b;font-size:10px}.spotPortal{position:relative;min-height:480px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(167,139,250,.18);border-radius:34px;background:radial-gradient(circle,rgba(139,92,246,.16),transparent 45%),linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.01));box-shadow:inset 0 0 80px rgba(139,92,246,.06),0 30px 100px rgba(0,0,0,.25)}.portalCore{position:relative;z-index:3;width:210px;height:210px;border-radius:50%;display:grid;place-content:center;text-align:center;padding:30px;background:radial-gradient(circle at 35% 30%,#a78bfa,#4c1d95 45%,#08070e 72%);box-shadow:0 0 45px rgba(139,92,246,.45),inset 0 0 50px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2)}.portalGlyph{font-size:35px;font-weight:1000;letter-spacing:-.1em}.portalCore strong{font-size:10px;letter-spacing:.14em;margin-top:8px}.portalCore span{font-size:12px;color:#d9d1ff;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.portalCore small{font-size:10px;color:#a8a1ba;margin-top:4px}.portalOrbit{position:absolute;border:1px solid rgba(167,139,250,.25);border-radius:50%;transform:rotate(-18deg)}.orbitOne{width:360px;height:130px;animation:spotOrbit 8s linear infinite}.orbitTwo{width:460px;height:180px;animation:spotOrbit 12s linear infinite reverse;border-color:rgba(96,165,250,.18)}.unlocked .portalCore{box-shadow:0 0 70px rgba(139,92,246,.7),0 0 140px rgba(96,165,250,.18),inset 0 0 50px rgba(0,0,0,.25)}@keyframes spotOrbit{to{transform:rotate(342deg)}}.spotCreate{max-width:1260px;margin:0 auto 40px;padding:22px;display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:14px;align-items:end;border:1px solid rgba(167,139,250,.18);border-radius:22px;background:rgba(255,255,255,.035)}.spotCreate h2,.spotsRules h2,.sectionHead h2{margin:6px 0 0;font-size:25px;letter-spacing:-.04em}.spotCreate p{max-width:560px;color:#858ca0;font-size:11px;line-height:1.5}.spotCreate label{display:grid;gap:7px;color:#858ca0;font-size:10px;font-weight:800;letter-spacing:.08em}.spotCreate input,.spotCreate select{width:100%;padding:12px;border-radius:11px;border:1px solid rgba(255,255,255,.1);background:#090b13;color:white;outline:none}.spotsGridSection,.spotsRules{max-width:1260px;margin:0 auto 70px}.sectionHead{display:flex;align-items:end;justify-content:space-between;margin-bottom:16px}.spotCount{color:#737a8e;font-size:11px}.emptySpot{padding:70px 24px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:24px;background:rgba(255,255,255,.02)}.emptyIcon{font-size:38px;color:#a78bfa}.emptySpot h3{font-size:22px;margin:10px 0}.emptySpot p{max-width:560px;margin:0 auto 20px;color:#858ca0;line-height:1.6;font-size:12px}.spotCards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.spotCard{display:flex;align-items:center;gap:14px;padding:18px;text-align:left;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));color:white;cursor:pointer;transition:.2s}.spotCard:hover,.spotCard.selected{transform:translateY(-2px);border-color:rgba(167,139,250,.35);background:rgba(139,92,246,.08)}.spotCardIcon{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:rgba(139,92,246,.1);font-size:20px}.spotCardBody{display:grid;gap:5px;min-width:0;flex:1}.spotCardBody b{font-size:13px}.spotCardBody small{color:#7d8498;font-size:10px}.spotCardArrow{font-size:9px;color:#a78bfa;font-weight:900}.spotsRules{display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:12px;align-items:stretch}.rule{padding:18px;border-radius:18px;background:#090b12;border:1px solid rgba(255,255,255,.07);display:flex;gap:12px}.rule>b{color:#8b5cf6;font-size:10px}.rule span{display:grid;gap:6px}.rule strong{font-size:11px}.rule small{color:#72798c;font-size:10px;line-height:1.45}@media(max-width:900px){.spotsHero{grid-template-columns:1fr;padding-top:50px}.spotPortal{min-height:360px}.spotCreate{grid-template-columns:1fr}.spotCards{grid-template-columns:1fr}.spotsRules{grid-template-columns:1fr 1fr}.spotsRules>div:first-child{grid-column:1/-1}}@media(max-width:560px){.spotsCopy h1{font-size:52px}.spotsActions{display:grid;grid-template-columns:1fr}.spotsPrimary,.spotsSecondary{width:100%;min-height:48px}.spotPortal{min-height:300px;border-radius:24px}.portalCore{width:170px;height:170px}.orbitOne{width:280px}.orbitTwo{width:350px}.spotsRules{grid-template-columns:1fr}.trustRow{display:grid}.spotCreate{padding:16px}}
`}</style>

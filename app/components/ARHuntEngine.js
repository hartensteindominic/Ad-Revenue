'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildClaimIntent, distanceMeters } from '../../lib/spatial-vault';

export default function ARHuntEngine({ anchor }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => () => { if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId); }, [watchId]);

  const target = useMemo(() => anchor || { id: 'demo-sky-vault', lat: 40.758, lng: -73.9855, altitude: null, radiusM: 35, privacy: 'public' }, [anchor]);
  const distance = position ? Math.round(distanceMeters(target, position)) : null;
  const intent = position ? buildClaimIntent(target, position) : null;

  function start() {
    if (!navigator.geolocation) { setError('Geolocation is not supported on this device.'); return; }
    setError('');
    const id = navigator.geolocation.watchPosition(
      result => { setPosition({ lat: result.coords.latitude, lng: result.coords.longitude, altitude: result.coords.altitude }); setWatching(true); },
      result => { setError(result.message || 'Location permission was not granted.'); setWatching(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setWatchId(id);
  }

  function stop() { if (watchId !== null) navigator.geolocation.clearWatch(watchId); setWatchId(null); setWatching(false); }

  return <section style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: 22, background: 'rgba(255,255,255,.025)', color: '#f7f8ff' }}>
    <div style={{ color: '#bdb4ff', fontSize: 10, letterSpacing: '.14em', fontWeight: 800 }}>AR HUNT ENGINE</div>
    <h2 style={{ margin: '10px 0 6px' }}>Find the anchor.</h2>
    <p style={{ color: '#8f96a8', lineHeight: 1.6 }}>Location is used to calculate proximity locally. A nearby result creates a claim intent; it never signs or transfers a wallet automatically.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '18px 0' }}>
      <div><small style={{ color: '#777f91' }}>DISTANCE</small><b style={{ display: 'block', marginTop: 5 }}>{distance === null ? '—' : `${distance} m`}</b></div>
      <div><small style={{ color: '#777f91' }}>RANGE</small><b style={{ display: 'block', marginTop: 5 }}>{intent?.eligible ? 'IN RANGE' : 'SEARCHING'}</b></div>
      <div><small style={{ color: '#777f91' }}>ANCHOR</small><b style={{ display: 'block', marginTop: 5 }}>{target.id}</b></div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={watching ? stop : start} style={button}>{watching ? 'Stop tracking' : 'Start AR hunt'}</button>{intent?.eligible && <button type="button" style={{ ...button, background: '#9b7cff', color: '#05060b' }} onClick={() => alert('Claim intent ready. Wallet confirmation is required.')}>Prepare claim</button>}</div>
    {error && <p role="alert" style={{ color: '#ff9f9f' }}>{error}</p>}
  </section>;
}

const button = { border: '1px solid rgba(255,255,255,.12)', background: '#0b0d16', color: '#fff', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' };

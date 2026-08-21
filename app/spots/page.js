'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWalletIdentity } from '../components/WalletIdentity';

function key(address) { return `voxel-vault-spots:${(address || 'guest').toLowerCase()}`; }

export default function SpotsPage() {
  const { address, connected, connect } = useWalletIdentity();
  const [spots, setSpots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!address) { setSpots([]); return; }
    try { setSpots(JSON.parse(localStorage.getItem(key(address)) || '[]')); } catch { setSpots([]); }
  }, [address]);

  const save = (next) => { setSpots(next); localStorage.setItem(key(address), JSON.stringify(next)); };

  const createSpot = () => {
    if (!address || !navigator.geolocation) return setMessage('Location is not available on this device.');
    setSaving(true); setMessage('Finding your Vault Spot…');
    navigator.geolocation.getCurrentPosition((position) => {
      const spot = { id: crypto.randomUUID(), lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)), createdAt: new Date().toISOString(), label: 'My Vault Spot' };
      save([spot, ...spots]); setSaving(false); setMessage('Vault Spot saved to this wallet.');
    }, () => { setSaving(false); setMessage('Location permission was declined. Nothing was saved.'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };

  const nearest = useMemo(() => spots[0], [spots]);

  if (!connected) return <main className="min-h-screen bg-[#05060c] text-white grid place-items-center p-6"><section className="max-w-md text-center"><div className="text-xs tracking-[.3em] opacity-60">VAULT SPOTS</div><h1 className="text-4xl font-semibold mt-3">Put your Vault in the world.</h1><p className="opacity-70 mt-4">Connect the same wallet you use everywhere in Voxel Vault. Your spots belong to that wallet identity.</p><button onClick={connect} className="mt-7 rounded-full px-6 py-3 bg-white text-black font-semibold">Connect wallet</button></section></main>;

  return <main className="min-h-screen bg-[#05060c] text-white px-5 py-8 md:px-10"><section className="max-w-6xl mx-auto"><div className="max-w-2xl"><div className="text-xs tracking-[.3em] opacity-60">VAULT SPOTS</div><h1 className="text-5xl md:text-7xl font-semibold mt-2">Leave something<br /><span className="opacity-60">worth coming back to.</span></h1><p className="opacity-70 mt-5 text-lg">Save a place in the real world to your Voxel Vault wallet. Later, Treasure Mode can turn it into a proximity hunt.</p></div>
    <div className="mt-10 grid lg:grid-cols-[1.4fr_.8fr] gap-5"><div className="min-h-[420px] rounded-[2rem] border border-white/10 bg-white/[.04] overflow-hidden relative"><div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 50% 45%, rgba(255,255,255,.16) 0 1px, transparent 1px)',backgroundSize:'28px 28px'}} /><div className="relative h-full min-h-[420px] grid place-items-center"><div className="text-center"><div className="text-6xl">📍</div><div className="mt-3 text-sm opacity-60">YOUR PERSONAL MAP</div><div className="text-xl font-semibold">{spots.length ? `${spots.length} saved Vault Spot${spots.length === 1 ? '' : 's'}` : 'No spots yet'}</div></div></div></div>
      <aside className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7"><div className="text-xs tracking-[.25em] opacity-50">WALLET-BOUND</div><div className="mt-3 font-mono text-sm opacity-70">{address.slice(0,6)}…{address.slice(-4)}</div><button disabled={saving} onClick={createSpot} className="w-full mt-8 rounded-2xl bg-white text-black py-4 font-semibold">{saving ? 'Locating…' : '＋ Save my current spot'}</button>{message && <p role="status" className="mt-4 text-sm opacity-70">{message}</p>}{nearest && <div className="mt-8 pt-6 border-t border-white/10"><div className="text-xs opacity-50">LATEST SPOT</div><div className="mt-2 font-semibold">{nearest.label}</div><div className="text-sm opacity-50 mt-1">{nearest.lat}, {nearest.lng}</div></div>}</aside></div>
    <div className="mt-8 grid md:grid-cols-3 gap-4">{spots.map((spot, i) => <article key={spot.id} className="rounded-2xl border border-white/10 p-5 bg-white/[.03]"><div className="text-xs opacity-50">SPOT {i + 1}</div><h2 className="mt-2 font-semibold">{spot.label}</h2><p className="text-xs opacity-50 mt-2">{spot.lat}, {spot.lng}</p><p className="text-xs opacity-40 mt-1">Saved {new Date(spot.createdAt).toLocaleDateString()}</p></article>)}</div>
  </section></main>;
}

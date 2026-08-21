'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadMapMemory, saveMapPlace, removeMapPlace } from '@/lib/mapMemory';

const DEFAULT_ZOOM = 13;
const MAPTILER_STYLE = 'https://api.maptiler.com/maps/streets-v2/style.json';

export default function AtlasMap({ initialCenter = null, vaultSpots = [], onPlaceSelect }) {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState(initialCenter || { lat: 40.7128, lng: -74.006 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selected, setSelected] = useState(null);
  const [mapbox, setMapbox] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => setPlaces(loadMapMemory()), []);

  useEffect(() => {
    let cancelled = false;
    async function loadMap() {
      if (typeof window === 'undefined') return;
      const token = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (!token) return;
      try {
        const maplibre = await import('maplibre-gl');
        if (!cancelled) setMapbox({ maplibre, token });
      } catch {
        if (!cancelled) setError('Map engine unavailable. Your saved Vault Spots are still safe.');
      }
    }
    loadMap();
    return () => { cancelled = true; };
  }, []);

  const allPlaces = useMemo(() => [
    ...places,
    ...vaultSpots.map((spot) => ({ ...spot, type: 'vault-spot' })),
  ], [places, vaultSpots]);

  function addCurrentPlace() {
    if (!navigator.geolocation) {
      setError('Location is not available on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        try {
          const saved = saveMapPlace({
            lat: coords.latitude,
            lng: coords.longitude,
            name: 'My Vault Spot',
            type: 'spot',
            source: 'device',
          });
          setPlaces(loadMapMemory());
          setCenter({ lat: saved.lat, lng: saved.lng });
          setSelected(saved);
          onPlaceSelect?.(saved);
        } catch (e) {
          setError(e.message || 'Could not save this place.');
        }
      },
      () => setError('Location permission was not granted.'),
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 },
    );
  }

  function forgetPlace(id) {
    removeMapPlace(id);
    setPlaces(loadMapMemory());
    if (selected?.id === id) setSelected(null);
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070914] shadow-[0_20px_80px_rgba(0,0,0,.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(143,92,255,.18),transparent_45%)] pointer-events-none" />
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.28em] text-violet-300">VOXEL ATLAS</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">Your world, remembered.</h2>
          <p className="mt-1 text-xs text-white/55">Explore places, Hunts and Vault Spots without turning the map into a spreadsheet.</p>
        </div>
        <button onClick={addCurrentPlace} className="rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/20 active:scale-95">+ Save here</button>
      </header>

      <div className="relative min-h-[520px]">
        {mapbox ? (
          <AtlasMapCanvas mapbox={mapbox} center={center} zoom={zoom} places={allPlaces} selected={selected} onSelect={(place) => { setSelected(place); onPlaceSelect?.(place); }} />
        ) : (
          <FallbackAtlas center={center} zoom={zoom} places={allPlaces} selected={selected} onSelect={(place) => { setSelected(place); onPlaceSelect?.(place); }} />
        )}

        {error && <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-amber-300/20 bg-black/70 px-4 py-3 text-xs text-amber-100 backdrop-blur-xl">{error}</div>}

        {selected && (
          <aside className="absolute bottom-4 left-4 z-20 w-[min(330px,calc(100%-2rem))] rounded-2xl border border-white/10 bg-[#090b18]/90 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] uppercase tracking-[.2em] text-violet-300">{selected.type || 'place'}</p><h3 className="mt-1 font-black">{selected.name}</h3></div>
              {selected.source === 'device' && <button onClick={() => forgetPlace(selected.id)} className="text-xs text-white/45 hover:text-white">Forget</button>}
            </div>
            {selected.note && <p className="mt-2 text-xs text-white/60">{selected.note}</p>}
            <p className="mt-3 font-mono text-[10px] text-white/35">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
          </aside>
        )}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 text-[10px] text-white/45 sm:px-6">
        <span className="rounded-full bg-white/5 px-3 py-1">{allPlaces.length} remembered places</span>
        <span className="rounded-full bg-white/5 px-3 py-1">Vault Spots stay separate from ownership</span>
        <span className="rounded-full bg-white/5 px-3 py-1">Location is opt-in</span>
      </footer>
    </section>
  );
}

function AtlasMapCanvas({ mapbox, center, zoom, places, selected, onSelect }) {
  const { maplibre, token } = mapbox;
  const mapId = `atlas-${Math.random().toString(36).slice(2)}`;
  useEffect(() => {
    const map = new maplibre.Map({
      container: mapId,
      style: `${MAPTILER_STYLE}?key=${encodeURIComponent(token)}`,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: true,
    });
    const markers = [];
    places.forEach((place) => {
      const marker = new maplibre.Marker({ color: place.type === 'vault-spot' ? '#a78bfa' : '#ffffff' })
        .setLngLat([place.lng, place.lat])
        .addTo(map);
      marker.getElement().addEventListener('click', () => onSelect(place));
      markers.push(marker);
    });
    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [mapId, maplibre, token, center.lat, center.lng, zoom, places, onSelect]);

  return <div id={mapId} className="absolute inset-0 min-h-[520px]" aria-label="Interactive Voxel Atlas map" />;
}

function FallbackAtlas({ center, places, selected, onSelect }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#101429,#090b17)] p-6">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative z-10 flex h-full min-h-[470px] items-center justify-center">
        <div className="text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-violet-300/20 bg-violet-300/10 text-2xl">◎</div><h3 className="font-black text-white">Atlas is ready</h3><p className="mt-2 max-w-sm text-xs text-white/50">Add a MapTiler key for the full satellite/street experience. Your saved places remain available locally.</p></div>
      </div>
      {places.map((place) => <button key={place.id} onClick={() => onSelect(place)} className="absolute z-20 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white backdrop-blur-xl" style={{ left: `${50 + ((place.lng - center.lng) * 12)}%`, top: `${50 - ((place.lat - center.lat) * 12)}%` }}>{place.name}</button>)}
    </div>
  );
}

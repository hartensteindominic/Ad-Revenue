'use client';

import React, { useMemo, useState } from 'react';

const LAYERS = [
  { id: 'all', label: 'Everything', icon: '✦' },
  { id: 'spots', label: 'Vault Spots', icon: '⌖' },
  { id: 'hunts', label: 'Hunts', icon: '◇' },
  { id: 'drops', label: 'Drops', icon: '◆' },
];

export default function VoxelAtlas({ places = [], onSelect }) {
  const [layer, setLayer] = useState('all');
  const visible = useMemo(() => layer === 'all' ? places : places.filter((p) => p.type === layer), [layer, places]);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#070913] shadow-[0_30px_100px_rgba(0,0,0,.35)]">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/35">Voxel Atlas</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">The world, collectible.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Discover places, drops, hunts and your own Vault Spots without turning the map into a cockpit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LAYERS.map((item) => (
              <button key={item.id} type="button" onClick={() => setLayer(item.id)} aria-pressed={layer === item.id} className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[.13em] transition ${layer === item.id ? 'border-white/25 bg-white/12 text-white' : 'border-white/10 bg-white/[.03] text-white/45 hover:bg-white/[.07]'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-6 min-h-[330px] overflow-hidden rounded-[26px] border border-white/8 bg-black/20">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 48%, rgba(255,255,255,.10), transparent 30%), linear-gradient(135deg, transparent 48%, rgba(255,255,255,.035) 49%, transparent 50%)', backgroundSize: 'auto, 120px 120px' }} />
          {visible.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div><div className="text-3xl">⌖</div><p className="mt-3 text-sm font-medium text-white/70">Nothing here yet</p><p className="mt-1 text-xs text-white/35">Explore the world and your first marker can appear here.</p></div>
            </div>
          ) : visible.map((place, index) => (
            <button key={place.id || index} type="button" onClick={() => onSelect?.(place)} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-left shadow-[0_0_35px_rgba(255,255,255,.10)] backdrop-blur-md transition hover:scale-105" style={{ left: `${place.x ?? 20 + ((index * 23) % 65)}%`, top: `${place.y ?? 25 + ((index * 31) % 55)}%` }}>
              <span className="block text-[9px] font-semibold uppercase tracking-[.16em] text-white/45">{place.type || 'spot'}</span>
              <span className="block mt-0.5 text-xs font-semibold text-white">{place.name || 'Unknown place'}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-white/30">
          <span>{visible.length} discovery{visible.length === 1 ? '' : 'ies'} nearby</span>
          <span>Location access is opt-in</span>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import { getAtlasSuggestions } from '@/lib/atlas/intelligence';

export default function AtlasSuggestions({ origin, places = [], onSelect }) {
  const suggestions = getAtlasSuggestions(origin, places);
  if (!suggestions.length) return null;

  return (
    <section aria-label="Explore nearby" className="pointer-events-auto w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">Voxel Atlas</p>
          <h2 className="text-sm font-semibold text-white">What’s around you?</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/50">AI ready</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-none">
        {suggestions.map(({ icon, label, place }) => (
          <button
            key={place.id}
            type="button"
            onClick={() => onSelect?.(place)}
            className="min-w-[190px] snap-start rounded-2xl border border-white/10 bg-[#0b0d18]/90 px-4 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,.28)] backdrop-blur-xl transition active:scale-[.98] hover:border-white/20"
          >
            <div className="mb-2 text-lg" aria-hidden="true">{icon}</div>
            <div className="text-xs font-medium leading-5 text-white">{label}</div>
            {Number.isFinite(place.distance) && (
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
                {place.distance < 1000 ? `${Math.round(place.distance)} m away` : `${(place.distance / 1000).toFixed(1)} km away`}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

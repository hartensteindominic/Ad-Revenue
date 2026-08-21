'use client';

import React, { useMemo, useState } from 'react';
import { attachCollectibleToSpot, detachCollectibleFromSpot } from '@/lib/vault-spots';

export default function VaultSpotCollectible({ spot, collectibles = [], onChange }) {
  const [selectedId, setSelectedId] = useState('');
  const current = spot?.collectible;
  const verified = Boolean(current?.verified);
  const options = useMemo(() => collectibles.filter((item) => item?.id && item?.verified), [collectibles]);

  function attach() {
    const collectible = options.find((item) => item.id === selectedId);
    if (!collectible) return;
    onChange?.(attachCollectibleToSpot(spot, collectible));
    setSelectedId('');
  }

  function detach() {
    onChange?.(detachCollectibleFromSpot(spot));
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#090b14]/90 p-4 text-white backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Vault Spot</p>
          <h3 className="mt-1 text-base font-semibold">{spot?.name || 'Saved place'}</h3>
        </div>
        {current && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-white/55">{verified ? 'On-chain verified' : 'Unverified'}</span>}
      </div>

      {current ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-medium">🧊 {current.name}</div>
          <div className="mt-1 text-xs text-white/45">{current.contract && current.tokenId != null ? `${current.contract.slice(0, 6)}…${current.contract.slice(-4)} · #${current.tokenId}` : 'Collectible reference saved locally'}</div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onChange?.(current)} className="rounded-xl border border-white/10 px-3 py-2 text-xs">Open</button>
            <button type="button" onClick={detach} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60">Remove</button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <select aria-label="Choose verified collectible" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none">
            <option value="">Choose a verified collectible</option>
            {options.map((item) => <option key={item.id} value={item.id}>{item.name || item.metadata?.name || item.id}</option>)}
          </select>
          <button type="button" disabled={!selectedId} onClick={attach} className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">Place in this Vault Spot</button>
          {!options.length && <p className="mt-3 text-xs text-white/40">Import and verify an NFT first. Voxel Vault will not claim an unverified collectible is yours.</p>}
        </div>
      )}
    </section>
  );
}

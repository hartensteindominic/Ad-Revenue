'use client';

import React, { useState } from 'react';

export default function VaultSpotCard({ spot, collectibleName = 'Your collectible', onSave }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');
  const [visibility, setVisibility] = useState(spot?.visibility || 'private');

  async function save() {
    if (!onSave || saving) return;
    if (!navigator.geolocation) { setStatus('unsupported'); return; }
    setSaving(true); setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await onSave({
            ...spot,
            name: spot?.name || collectibleName,
            visibility,
            latitude: Number(coords.latitude.toFixed(6)),
            longitude: Number(coords.longitude.toFixed(6)),
            savedAt: new Date().toISOString(),
          });
          setStatus('saved');
        } catch { setStatus('error'); }
        finally { setSaving(false); }
      },
      () => { setStatus('denied'); setSaving(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  const message = {
    idle: 'A place to return to. Location permission is requested only when you save.',
    locating: 'Finding this spot…',
    saved: 'Vault Spot saved. Nothing is shared until you choose to share it.',
    denied: 'Location access was declined. Nothing was saved.',
    unsupported: 'This device does not provide location services.',
    error: 'The spot could not be saved. Nothing was marked as saved.'
  }[status];

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,.22)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">Vault Spot</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{spot?.name || collectibleName || 'Untitled spot'}</h3>
          <p className="mt-1 text-xs leading-5 text-white/50">{message}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-white/45">{visibility}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-white/55">
        <div className="font-medium text-white/75">Location sharing is opt-in</div>
        <p className="mt-1 leading-5">Voxel Vault asks for your location only after you tap Save spot. It does not imply or request live tracking.</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Vault Spot visibility</span>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={saving} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none">
            <option value="private">Private</option>
            <option value="friends">Friends</option>
            <option value="public">Public</option>
          </select>
        </label>
        <button type="button" onClick={save} disabled={saving || !onSave} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">
          {saving ? 'Locating…' : status === 'saved' ? 'Saved ✓' : 'Save spot'}
        </button>
      </div>
    </section>
  );
}

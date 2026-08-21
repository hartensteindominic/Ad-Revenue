'use client';

import React, { useState } from 'react';

export default function VaultSpotCard({ spot, onSave }) {
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState(spot?.visibility || 'private');

  async function save() {
    if (!onSave) return;
    setSaving(true);
    try { await onSave({ ...spot, visibility }); } finally { setSaving(false); }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,.22)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">Vault Spot</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{spot?.name || 'Untitled spot'}</h3>
          <p className="mt-1 text-xs leading-5 text-white/50">{spot?.description || 'A place to return to.'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-white/45">{visibility}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-white/55">
        <div className="font-medium text-white/75">Location sharing is opt-in</div>
        <p className="mt-1 leading-5">Saving a spot does not request or imply live location access. Your exact coordinates stay private unless you choose to share them.</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Vault Spot visibility</span>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none">
            <option value="private">Private</option>
            <option value="friends">Friends</option>
            <option value="public">Public</option>
          </select>
        </label>
        <button type="button" onClick={save} disabled={saving || !onSave} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">
          {saving ? 'Saving…' : 'Save spot'}
        </button>
      </div>
    </section>
  );
}

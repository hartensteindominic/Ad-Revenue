'use client';

import { useEffect, useState } from 'react';

export default function CollectorTools({ assetId, name }) {
  const key = 'voxel-vault-saved-assets';
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(key) || '[]');
      setSaved(ids.includes(String(assetId)));
    } catch {}
  }, [assetId]);

  function toggleSaved() {
    try {
      const ids = JSON.parse(localStorage.getItem(key) || '[]').map(String);
      const next = saved ? ids.filter((id) => id !== String(assetId)) : [...new Set([...ids, String(assetId)])];
      localStorage.setItem(key, JSON.stringify(next));
      setSaved(!saved);
    } catch {}
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} | Voxel Vault`, text: `Inspect ${name} in real 3D.`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
      <button onClick={toggleSaved} style={buttonStyle(saved)} aria-pressed={saved}>{saved ? '★ Saved' : '☆ Save to Vault'}</button>
      <button onClick={share} style={buttonStyle(false)}>{copied ? '✓ Link copied' : '↗ Share object'}</button>
    </div>
  );
}

const buttonStyle = (active) => ({
  border: '1px solid rgba(255,255,255,.14)',
  background: active ? 'rgba(155,132,255,.16)' : 'rgba(255,255,255,.04)',
  color: '#fff',
  borderRadius: 999,
  padding: '10px 14px',
  fontWeight: 750,
  cursor: 'pointer',
});

'use client';

import React from 'react';

export default function SponsoredDropCard({ drop, onDiscover }) {
  const isHybrid = drop?.format === 'hybrid';
  return <article style={{ borderRadius: 24, overflow: 'hidden', background: 'rgba(12,14,22,.92)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 70px rgba(0,0,0,.28)' }}>
    {drop?.artwork?.imageUri && <img src={drop.artwork.imageUri} alt={drop.artwork.alt || drop.title} style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} loading="lazy" />}
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div><div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a9b0c4' }}>{drop.disclosure}</div><h3 style={{ margin: '6px 0 0', color: '#fff' }}>{drop.title}</h3></div>
        <span style={{ fontSize: 11, color: '#cfd5e8' }}>{drop.sponsor?.name}</span>
      </div>
      {isHybrid && <p style={{ color: '#969db1', fontSize: 13, margin: '12px 0' }}>Collect the artwork, then reveal its connected 3D collectible.</p>}
      <button type="button" onClick={onDiscover} style={{ width: '100%', marginTop: 8, border: 0, borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Discover Drop</button>
    </div>
  </article>;
}

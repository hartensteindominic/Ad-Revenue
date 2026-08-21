'use client';

import { useState } from 'react';
import { NFT_WORLD_CATALOG } from '../../lib/world/nftWorldCatalog.js';

export default function SponsorPage() {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('500');
  const [nftId, setNftId] = useState(String(NFT_WORLD_CATALOG.find((item) => item.sponsored)?.id || 100));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function fund() {
    setBusy(true); setStatus('Opening secure checkout…');
    try {
      const amountCents = Math.round(Number(budget) * 100);
      const campaignId = `${(name || 'campaign').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42)}-${Date.now().toString(36)}`;
      const response = await fetch('/api/sponsor/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId, campaignName: name || 'Voxel Vault Discovery Campaign', amountCents, featuredNFTId: Number(nftId) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout failed');
      window.location.assign(data.url);
    } catch (error) { setStatus(error?.message || 'Unable to start checkout'); setBusy(false); }
  }

  return <main className="sponsor"><a href="/" className="back">← Voxel Vault</a><section className="shell"><div className="eyebrow">SPONSORED DISCOVERY · B2B</div><h1>Fund a <em>world.</em></h1><p className="intro">Brands can fund free collectible discoveries. Players never need to pay to participate. Sponsorship is clearly disclosed and campaign funds are accounted for in USD cents.</p><div className="form"><label>Campaign name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Buffalo Discovery" maxLength={120} /></label><label>Budget (USD)<input inputMode="decimal" type="number" min="1" step="1" value={budget} onChange={(e) => setBudget(e.target.value)} /></label><label>Featured collectible<select value={nftId} onChange={(e) => setNftId(e.target.value)}>{NFT_WORLD_CATALOG.filter((item) => item.sponsored).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.rarity}</option>)}</select></label><div className="split"><span><b>70%</b><small>collector rewards</small></span><span><b>10%</b><small>Vault placement</small></span><span><b>20%</b><small>protocol</small></span></div><button onClick={fund} disabled={busy}>{busy ? 'Opening…' : 'Fund discovery with Stripe →'}</button>{status && <p className="status">{status}</p>}</div><p className="fine">This page creates a Stripe payment session only. It does not mint, transfer NFTs, or credit rewards by itself. Verified payment settlement remains the authority.</p></section><style jsx>{`.sponsor{min-height:100vh;background:#05060b;color:#f6f7ff;padding:28px 5vw;font-family:Inter,system-ui,sans-serif}.back{color:#a7adbf;text-decoration:none;font-size:13px}.shell{max-width:820px;margin:80px auto}.eyebrow{font-size:10px;letter-spacing:.18em;color:#9c8cff;font-weight:900}.shell h1{font-size:clamp(48px,8vw,86px);letter-spacing:-.06em;line-height:.95;margin:16px 0}.shell h1 em{font-style:normal;color:#a08cff}.intro{max-width:680px;color:#969eaf;line-height:1.75}.form{margin-top:40px;border:1px solid #222638;background:#0b0d16;border-radius:24px;padding:26px;display:grid;gap:18px}.form label{display:grid;gap:8px;color:#aab0c0;font-size:12px}.form input,.form select{width:100%;border:1px solid #252a3b;background:#070910;color:#fff;border-radius:12px;padding:13px 14px;outline:none}.form button{border:0;border-radius:13px;padding:14px;background:#a18cff;color:#07060d;font-weight:900;cursor:pointer}.form button:disabled{opacity:.55}.split{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.split span{border:1px solid #202437;border-radius:14px;padding:13px}.split b{display:block;font-size:20px}.split small{color:#737b90}.status{color:#a8a0ff;font-size:12px}.fine{color:#666e82;font-size:11px;line-height:1.6;margin-top:16px}@media(max-width:600px){.shell{margin:55px auto}.split{grid-template-columns:1fr}.form{padding:18px}}
`}</style></main>;
}

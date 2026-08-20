'use client';

import dynamic from 'next/dynamic';
import { buildSponsoredCollectible, createSponsoredCampaign } from '../../lib/sponsoredCollectibles.mjs';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });

const campaign = createSponsoredCampaign({
  id: 'demo-field-relics',
  sponsorName: 'Voxel Vault Demo Sponsor',
  title: 'Field Relic Series',
  budget: 1000,
});

const collectible = buildSponsoredCollectible({
  campaign,
  collectible: {
    id: 'sponsored-field-relic-01',
    name: 'Field Relic // Signal One',
    seed: 'sponsored-field-relic-01',
    rarity: 'Limited',
    material: 'Chrome Glass',
    shape: 'artifact',
    renderMode: 'voxel',
  },
});

export default function SponsoredCollectibleShowcase() {
  return (
    <section className="sponsoredShowcase" aria-labelledby="sponsored-title">
      <div className="sponsoredCopy">
        <div className="sponsoredEyebrow">SPONSORED COLLECTIBLE · PROTOTYPE</div>
        <h2 id="sponsored-title">Brands fund the hunt.<br /><em>Collectors keep the object.</em></h2>
        <p>A sponsor-funded campaign can create a limited 3D object, place it inside a real-world hunt, and fund collector rewards. Sponsorship is disclosed as part of provenance. Discovery never grants ownership.</p>
        <div className="sponsorMeta">
          <span><b>SPONSOR</b>{collectible.sponsorship.sponsorName}</span>
          <span><b>CAMPAIGN</b>{campaign.title}</span>
          <span><b>DISCLOSURE</b>{collectible.sponsorship.label}</span>
        </div>
      </div>
      <div className="sponsoredObject" aria-label="Sponsored collectible 3D preview">
        <VoxelViewer shape={collectible.shape} seed={collectible.seed} rarity={collectible.rarity} material={collectible.material} compact showcase interactive={false} label={false} />
        <div className="sponsoredObjectLabel">
          <strong>{collectible.name}</strong>
          <span>Sponsored collectible · Ownership requires wallet authorization</span>
        </div>
      </div>
      <style jsx>{`
        .sponsoredShowcase{max-width:1400px;margin:0 auto;padding:80px 5vw;display:grid;grid-template-columns:1.05fr .95fr;gap:42px;align-items:center;border-top:1px solid rgba(255,255,255,.08)}
        .sponsoredCopy{max-width:700px}.sponsoredEyebrow{font-size:10px;letter-spacing:.2em;color:#f0b85b;font-weight:900;margin-bottom:16px}.sponsoredCopy h2{font-size:clamp(34px,4vw,64px);line-height:.98;letter-spacing:-.045em;margin:0 0 20px}.sponsoredCopy h2 em{font-style:normal;color:#a98cff}.sponsoredCopy p{color:#9da3b5;line-height:1.8;max-width:620px}.sponsorMeta{display:grid;gap:8px;margin-top:24px;color:#c9cce0;font-size:12px}.sponsorMeta span{display:flex;gap:10px;align-items:center}.sponsorMeta b{font-size:9px;letter-spacing:.16em;color:#777e96;min-width:82px}.sponsoredObject{min-height:440px;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:radial-gradient(circle at 50% 38%,rgba(151,119,255,.14),transparent 42%),#080a12;position:relative;overflow:hidden}.sponsoredObjectLabel{position:absolute;left:20px;right:20px;bottom:18px;padding:14px 16px;border:1px solid rgba(255,255,255,.1);background:rgba(5,6,11,.76);backdrop-filter:blur(14px);border-radius:16px;display:grid;gap:4px}.sponsoredObjectLabel strong{font-size:14px}.sponsoredObjectLabel span{font-size:10px;color:#9da3b5}
        @media(max-width:800px){.sponsoredShowcase{grid-template-columns:1fr;padding:60px 5vw}.sponsoredObject{min-height:360px}}
      `}</style>
    </section>
  );
}

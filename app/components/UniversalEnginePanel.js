'use client';

import { useMemo, useState } from 'react';
import { createUniversalCollectible, validateUniversalCollectible, collectibleFingerprint } from '../../lib/universalCollectible';

const DEMO_OBJECTS = [
  { name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001', realityBasis: { inspiredBy: 'vintage field camera', plausibility: 'realistic' } },
  { name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001', realityBasis: { inspiredBy: 'industrial inspection robot', plausibility: 'realistic' } },
  { name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001', realityBasis: { inspiredBy: 'modern skateboard', plausibility: 'realistic' } },
];

export default function UniversalEnginePanel() {
  const [open, setOpen] = useState(false);
  const objects = useMemo(() => DEMO_OBJECTS.map(input => {
    const collectible = createUniversalCollectible(input);
    const validation = validateUniversalCollectible(collectible);
    return { ...collectible, validation, fingerprint: collectibleFingerprint(collectible) };
  }), []);
  const healthy = objects.every(object => object.validation.valid);

  return <section className="enginePanel" aria-label="Universal collectible engine">
    <div className="enginePanelTop">
      <div>
        <div className="engineEyebrow"><span /> UNIVERSAL COLLECTIBLE ENGINE · LIVE</div>
        <h3>One engine. <em>Any object.</em></h3>
        <p>Real-world-inspired 3D objects share one ownership, metadata and provenance model.</p>
      </div>
      <button className="engineToggle" onClick={() => setOpen(value => !value)}>{open ? 'Hide engine' : 'Inspect engine'} ↗</button>
    </div>
    <div className="engineObjects">
      {objects.map(object => <div className="engineObject" key={object.fingerprint}>
        <span className="engineStatus">{object.validation.valid ? '● READY' : '● ERROR'}</span>
        <strong>{object.name}</strong>
        <span>{object.family} · {object.rarity}</span>
        <code>{object.fingerprint}</code>
      </div>)}
    </div>
    {open && <div className="engineDetails">
      <div><b>Schema</b><span>voxel-vault/universal-collectible</span></div>
      <div><b>Creation modes</b><span>Procedural · AI-assisted · Creator upload</span></div>
      <div><b>Asset targets</b><span>GLB · GLTF · future platform adapters</span></div>
      <div><b>Engine check</b><span>{healthy ? 'All three reference objects validate successfully.' : 'Validation failure detected.'}</span></div>
    </div>}
    <style jsx>{`
      .enginePanel{max-width:1400px;margin:0 auto;padding:22px 5vw 12px;position:relative;z-index:3}.enginePanelTop{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:22px;border:1px solid rgba(155,124,255,.22);border-radius:22px 22px 10px 10px;background:linear-gradient(135deg,rgba(17,15,31,.94),rgba(7,13,22,.92));box-shadow:0 0 45px rgba(116,76,255,.08),inset 0 1px rgba(255,255,255,.05)}.engineEyebrow{font-size:9px;letter-spacing:.2em;font-weight:900;color:#8f97ad}.engineEyebrow span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}.enginePanel h3{margin:8px 0 5px;font-size:clamp(22px,3vw,34px);letter-spacing:-.04em}.enginePanel h3 em{font-style:normal;background:linear-gradient(90deg,#a183ff,#55e6ff);-webkit-background-clip:text;background-clip:text;color:transparent}.enginePanel p{margin:0;color:#969db0;font-size:12px;max-width:650px}.engineToggle{border:1px solid rgba(155,124,255,.35);background:rgba(155,124,255,.08);color:#e7e2ff;border-radius:999px;padding:10px 15px;font-weight:800;cursor:pointer;white-space:nowrap}.engineObjects{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-top:0;overflow:hidden;border-radius:0 0 18px 18px}.engineObject{padding:15px 18px;background:rgba(8,10,17,.96);display:grid;gap:5px}.engineObject strong{font-size:15px}.engineObject>span:not(.engineStatus){font-size:11px;color:#7f879b;text-transform:capitalize}.engineObject code{font-size:9px;color:#6e76e9;letter-spacing:.08em}.engineStatus{font-size:8px;color:#55e6ff;font-weight:900;letter-spacing:.15em}.engineDetails{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(255,255,255,.06);margin-top:10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}.engineDetails div{padding:14px 16px;background:#090b12;display:grid;gap:5px}.engineDetails b{font-size:9px;letter-spacing:.14em;color:#8f97ad}.engineDetails span{font-size:11px;color:#d9dceb}@media(max-width:700px){.enginePanel{padding-left:16px;padding-right:16px}.enginePanelTop{align-items:flex-start;flex-direction:column}.engineObjects{grid-template-columns:1fr}.engineDetails{grid-template-columns:1fr}.engineToggle{width:100%}}
    `}</style>
  </section>;
}

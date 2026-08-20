'use client';

import { useMemo, useState } from 'react';
import {
  createUniversalCollectible,
  validateUniversalCollectible,
  collectibleFingerprint,
  OBJECT_FAMILIES,
  RARITIES,
} from '../../lib/universalCollectible';

const FAMILY_NAMES = {
  vehicles: ['Aero', 'Drift', 'Vector', 'Nomad'],
  technology: ['Quantum', 'Signal', 'Atlas', 'Circuit'],
  fashion: ['Chrome', 'Velvet', 'Prism', 'Lumen'],
  sports: ['Velocity', 'Pulse', 'Orbit', 'Apex'],
  architecture: ['Monolith', 'Arc', 'Habitat', 'Spire'],
  nature: ['Ember', 'Frost', 'Bloom', 'Grove'],
  creatures: ['Obsidian', 'Solar', 'Lunar', 'Titan'],
  artifacts: ['Ancient', 'Relic', 'Echo', 'Vault'],
  science: ['Muon', 'Nova', 'Helix', 'Vector'],
  scifi: ['Stellar', 'Void', 'Neon', 'Orbital'],
  fantasy: ['Mythic', 'Rune', 'Astral', 'Dragon'],
  furniture: ['Modular', 'Cobalt', 'Arc', 'Foundry'],
  other: ['Unknown', 'Prime', 'Zero', 'Echo'],
};

const OBJECT_WORDS = ['Object', 'Artifact', 'Device', 'Relic', 'Specimen', 'Machine', 'Form', 'Construct'];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateObject() {
  const family = randomFrom(OBJECT_FAMILIES);
  const prefix = randomFrom(FAMILY_NAMES[family]);
  const noun = randomFrom(OBJECT_WORDS);
  const rarity = randomFrom(RARITIES);
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const collectible = createUniversalCollectible({
    name: `${prefix} ${noun}`,
    family,
    subtype: family,
    creationMode: 'procedural',
    rarity,
    seed,
    description: `A procedurally generated ${family} collectible from the Voxel Vault universal engine.`,
    realityBasis: {
      inspiredBy: `${family} design language`,
      plausibility: family === 'fantasy' || family === 'scifi' ? 'fictional' : 'realistic',
    },
    traits: [
      { trait_type: 'Family', value: family },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Generation', value: 'Procedural' },
    ],
  });
  return { ...collectible, fingerprint: collectibleFingerprint(collectible) };
}

const INITIAL = [
  generateObject(),
  generateObject(),
  generateObject(),
];

export default function UniversalEnginePanel() {
  const [open, setOpen] = useState(false);
  const [objects, setObjects] = useState(INITIAL);
  const healthy = useMemo(() => objects.every(object => validateUniversalCollectible(object).valid), [objects]);

  function generate() {
    setObjects(previous => [generateObject(), ...previous].slice(0, 6));
  }

  return <section className="enginePanel" aria-label="Universal collectible engine">
    <div className="enginePanelTop">
      <div>
        <div className="engineEyebrow"><span /> UNIVERSAL 3D COLLECTIBLE ENGINE · LIVE</div>
        <h3>Create something <em>unexpected.</em></h3>
        <p>Generate realistic or fantastical collectible concepts from one portable ownership, metadata and provenance schema.</p>
      </div>
      <div className="engineActions">
        <button className="generateButton" onClick={generate}>✦ Generate 3D NFT</button>
        <button className="engineToggle" onClick={() => setOpen(value => !value)}>{open ? 'Hide engine' : 'Inspect engine'} ↗</button>
      </div>
    </div>
    <div className="engineObjects">
      {objects.map(object => {
        const validation = validateUniversalCollectible(object);
        return <div className="engineObject" key={object.fingerprint}>
          <span className="engineStatus">{validation.valid ? '● READY' : '● ERROR'}</span>
          <strong>{object.name}</strong>
          <span>{object.family} · {object.rarity}</span>
          <code>{object.fingerprint}</code>
        </div>;
      })}
    </div>
    {open && <div className="engineDetails">
      <div><b>Schema</b><span>voxel-vault/universal-collectible v1</span></div>
      <div><b>Creation modes</b><span>Procedural · AI-assisted · Creator upload</span></div>
      <div><b>Asset targets</b><span>GLB · GLTF · AR · future platform adapters</span></div>
      <div><b>Ownership</b><span>Unminted → minting → owned → transferred</span></div>
      <div><b>Engine check</b><span>{healthy ? 'All generated objects pass schema validation.' : 'Validation failure detected.'}</span></div>
      <div><b>Important</b><span>Generation here creates a collectible record. Minting remains a separate wallet-signed blockchain action.</span></div>
    </div>}
    <style jsx>{`
      .enginePanel{max-width:1400px;margin:0 auto;padding:22px 5vw 12px;position:relative;z-index:3}.enginePanelTop{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:22px;border:1px solid rgba(155,124,255,.22);border-radius:22px 22px 10px 10px;background:linear-gradient(135deg,rgba(17,15,31,.94),rgba(7,13,22,.92));box-shadow:0 0 45px rgba(116,76,255,.08),inset 0 1px rgba(255,255,255,.05)}.engineEyebrow{font-size:9px;letter-spacing:.2em;font-weight:900;color:#8f97ad}.engineEyebrow span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}.enginePanel h3{margin:8px 0 5px;font-size:clamp(22px,3vw,34px);letter-spacing:-.04em}.enginePanel h3 em{font-style:normal;background:linear-gradient(90deg,#a183ff,#55e6ff);-webkit-background-clip:text;background-clip:text;color:transparent}.enginePanel p{margin:0;color:#969db0;font-size:12px;max-width:700px}.engineActions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.generateButton,.engineToggle{border-radius:999px;padding:10px 15px;font-weight:850;cursor:pointer;white-space:nowrap}.generateButton{border:1px solid rgba(85,230,255,.35);background:linear-gradient(135deg,rgba(161,131,255,.22),rgba(85,230,255,.12));color:#fff;box-shadow:0 0 24px rgba(85,230,255,.08)}.engineToggle{border:1px solid rgba(155,124,255,.35);background:rgba(155,124,255,.08);color:#e7e2ff}.engineObjects{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-top:0;overflow:hidden;border-radius:0 0 18px 18px}.engineObject{padding:15px 18px;background:rgba(8,10,17,.96);display:grid;gap:5px}.engineObject strong{font-size:15px}.engineObject>span:not(.engineStatus){font-size:11px;color:#7f879b;text-transform:capitalize}.engineObject code{font-size:9px;color:#6e76e9;letter-spacing:.08em}.engineStatus{font-size:8px;color:#55e6ff;font-weight:900;letter-spacing:.15em}.engineDetails{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(255,255,255,.06);margin-top:10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}.engineDetails div{padding:14px 16px;background:#090b12;display:grid;gap:5px}.engineDetails b{font-size:9px;letter-spacing:.14em;color:#8f97ad}.engineDetails span{font-size:11px;color:#d9dceb}@media(max-width:700px){.enginePanel{padding-left:16px;padding-right:16px}.enginePanelTop{align-items:flex-start;flex-direction:column}.engineActions{width:100%;justify-content:stretch}.generateButton,.engineToggle{flex:1}.engineObjects{grid-template-columns:1fr}.engineDetails{grid-template-columns:1fr}}
    `}</style>
  </section>;
}

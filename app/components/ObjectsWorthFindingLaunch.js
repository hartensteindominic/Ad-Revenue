'use client';

import { useEffect, useMemo, useState } from 'react';

const OBJECTS = [
  { name: 'Obsidian Dragon', rarity: 'MYTHIC', distance: 38, kind: 'CREATURE', accent: 'violet', description: 'A crystalline relic hiding in plain sight.' },
  { name: 'Neon Relay', rarity: 'RARE', distance: 112, kind: 'ARTIFACT', accent: 'cyan', description: 'A dormant signal waiting for a collector.' },
  { name: 'Pocket World', rarity: 'UNCOMMON', distance: 286, kind: 'WORLD', accent: 'blue', description: 'A tiny world with a very large secret.' },
];

export default function ObjectsWorthFindingLaunch() {
  const [nearby, setNearby] = useState(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setNearby(true),
      () => setNearby(false),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
    );
  }, []);

  const object = OBJECTS[selected];
  const status = useMemo(() => nearby === true ? 'NEARBY SIGNALS ENABLED' : nearby === false ? 'LOCATION OPTIONAL' : 'DISCOVERY READY', [nearby]);

  return (
    <section className="owfShell" aria-labelledby="owf-title">
      <div className="owfGlow owfGlowA" />
      <div className="owfGlow owfGlowB" />
      <div className="owfInner">
        <div className="owfEyebrow"><span /> OBJECTS WORTH FINDING <b>{status}</b></div>
        <div className="owfGrid">
          <div className="owfCopy">
            <h2 id="owf-title">Walk into the world.<br /><em>Find something worth keeping.</em></h2>
            <p>Voxel Vault turns nearby discoveries into real 3D collectibles. Your phone can stay down. Location helps discovery, while ownership is only confirmed after the verified chain transaction.</p>
            <div className="owfSteps" aria-label="Collection flow">
              {['WALK', 'DISCOVER', 'COLLECT', 'EARN'].map((step, index) => <span key={step}><i>{index + 1}</i>{step}</span>)}
            </div>
            <a className="owfPrimary" href="/objects-worth-finding">Explore Objects Worth Finding <span>→</span></a>
          </div>
          <div className="owfObject" role="group" aria-label="Nearby object preview">
            <div className={`owfOrb ${object.accent}`}><div className="owfCore" /><div className="owfRing" /></div>
            <div className="owfCardTop"><span>{object.kind}</span><b>{object.rarity}</b></div>
            <div className="owfObjectInfo"><small>{nearby === true ? 'SIGNAL DETECTED' : 'OBJECT DETECTED'}</small><h3>{object.name}</h3><p>{object.description}</p><strong>{object.distance}m</strong></div>
            <div className="owfPicker">{OBJECTS.map((item, index) => <button key={item.name} type="button" onClick={() => setSelected(index)} aria-label={`Show ${item.name}`} className={selected === index ? 'active' : ''}><span>{String(index + 1).padStart(2, '0')}</span>{item.name}</button>)}</div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .owfShell{position:relative;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,#080914 0%,#0a0b16 48%,#07070d 100%);color:#f8f8ff}.owfInner{max-width:1380px;margin:auto;padding:72px 5vw 76px;position:relative;z-index:2}.owfGlow{position:absolute;border-radius:999px;filter:blur(70px);opacity:.2;pointer-events:none}.owfGlowA{width:360px;height:360px;background:#7b5cff;right:-100px;top:-100px}.owfGlowB{width:280px;height:280px;background:#16c9ff;left:-100px;bottom:-140px}.owfEyebrow{display:flex;gap:12px;align-items:center;color:#a9adbd;font-size:11px;font-weight:800;letter-spacing:.16em}.owfEyebrow span{width:7px;height:7px;border-radius:50%;background:#9b7cff;box-shadow:0 0 16px #9b7cff}.owfEyebrow b{margin-left:auto;color:#8b91a5;font-size:9px;letter-spacing:.1em}.owfGrid{display:grid;grid-template-columns:1.05fr .95fr;gap:58px;align-items:center;margin-top:24px}.owfCopy h2{font-size:clamp(38px,5.4vw,76px);line-height:.96;letter-spacing:-.055em;margin:0;max-width:760px}.owfCopy h2 em{font-style:normal;color:#9b7cff}.owfCopy p{color:#a9adbd;max-width:650px;font-size:16px;line-height:1.65;margin:24px 0}.owfSteps{display:flex;gap:9px;flex-wrap:wrap;margin:24px 0 30px}.owfSteps span{display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);border-radius:999px;padding:7px 11px;color:#d9dbe4;font-size:10px;font-weight:850;letter-spacing:.08em}.owfSteps i{font-style:normal;color:#9b7cff}.owfPrimary{display:inline-flex;align-items:center;gap:18px;text-decoration:none;color:#08090d;background:#f5f3ff;border-radius:13px;padding:14px 18px;font-weight:900;font-size:13px}.owfPrimary span{font-size:18px}.owfObject{min-height:430px;border:1px solid rgba(255,255,255,.09);border-radius:28px;background:radial-gradient(circle at 50% 42%,rgba(123,92,255,.16),transparent 38%),rgba(255,255,255,.025);padding:24px;position:relative;box-shadow:inset 0 1px rgba(255,255,255,.06)}.owfCardTop{display:flex;justify-content:space-between;color:#858b9f;font-size:9px;font-weight:900;letter-spacing:.12em}.owfCardTop b{color:#c6baff}.owfOrb{width:210px;height:210px;margin:32px auto 8px;border-radius:50%;position:relative;display:grid;place-items:center;background:radial-gradient(circle,#d9d1ff 0 4%,rgba(155,124,255,.5) 5%,rgba(155,124,255,.08) 35%,transparent 68%);filter:drop-shadow(0 0 38px rgba(155,124,255,.35))}.owfOrb.cyan{filter:drop-shadow(0 0 38px rgba(22,201,255,.3));background:radial-gradient(circle,#d7faff 0 4%,rgba(22,201,255,.5) 5%,rgba(22,201,255,.08) 35%,transparent 68%)}.owfOrb.blue{filter:drop-shadow(0 0 38px rgba(60,130,255,.3))}.owfCore{width:64px;height:64px;transform:rotate(45deg);border:1px solid rgba(255,255,255,.72);background:linear-gradient(135deg,rgba(255,255,255,.5),rgba(155,124,255,.08));box-shadow:inset -15px -15px 25px rgba(0,0,0,.25)}.owfRing{position:absolute;inset:20px;border:1px solid rgba(255,255,255,.16);border-radius:50%;transform:rotate(-20deg) scaleX(1.6)}.owfObjectInfo{text-align:center}.owfObjectInfo small{color:#9b7cff;font-size:9px;font-weight:900;letter-spacing:.15em}.owfObjectInfo h3{font-size:28px;margin:7px 0 5px;letter-spacing:-.035em}.owfObjectInfo p{color:#898fa2;font-size:12px;margin:0 auto 7px;max-width:300px}.owfObjectInfo strong{color:#fff;font-size:13px}.owfPicker{display:flex;gap:6px;margin-top:22px}.owfPicker button{flex:1;text-align:left;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);border-radius:10px;padding:9px;color:#9da3b5;font-size:9px;cursor:pointer}.owfPicker button.active{border-color:rgba(155,124,255,.55);color:#fff;background:rgba(155,124,255,.08)}.owfPicker span{display:block;color:#6e7487;font-size:8px;margin-bottom:4px}@media(max-width:800px){.owfInner{padding:48px 20px 54px}.owfEyebrow b{display:none}.owfGrid{grid-template-columns:1fr;gap:32px}.owfCopy h2{font-size:46px}.owfObject{min-height:410px}.owfOrb{width:180px;height:180px}.owfPicker button{font-size:8px}.owfPicker button:nth-child(3){display:none}}
      `}</style>
    </section>
  );
}

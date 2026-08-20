'use client';

import { useEffect, useMemo, useState } from 'react';
import VoxelViewer from '../components/VoxelViewer';

const SHAPES = [
  ['car', 'Midnight GT'],
  ['robot', 'Astra Robot'],
  ['ship', 'Deep Space Hauler'],
  ['villa', 'Modern Villa'],
  ['owl', 'Forest Owl'],
  ['fox', 'Red Fox'],
  ['statue', 'Marble Guardian'],
  ['tree', 'Crystal Tree'],
];

export default function CreatorStudio() {
  const [shape, setShape] = useState('car');
  const [name, setName] = useState('My Voxel Creation');
  const [description, setDescription] = useState('A collectible 3D voxel creation made in Voxel Vault.');
  const [saved, setSaved] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vv-draft');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.name) setName(draft.name);
      if (draft.description) setDescription(draft.description);
      if (draft.shape) setShape(draft.shape);
    } catch {}
  }, []);

  const selected = useMemo(() => SHAPES.find(([id]) => id === shape)?.[1] || 'Voxel Creation', [shape]);

  function saveDraft() {
    localStorage.setItem('vv-draft', JSON.stringify({ name, description, shape, updatedAt: new Date().toISOString() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function exportDraft() {
    const payload = { name, description, shape, format: 'voxel-vault-draft', version: 1, createdAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'voxel-creation'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="studio">
      <style>{styles}</style>
      <header className="studioNav">
        <a className="brand" href="/"><span className="mark">V</span><span>VOXEL<span>VAULT</span></span></a>
        <div className="crumb">CREATOR STUDIO <b>/</b> {selected.toUpperCase()}</div>
        <div className="navActions"><a href="/">← Back to Vault</a><button onClick={saveDraft}>{saved ? '✓ Saved' : 'Save Draft'}</button></div>
      </header>

      <section className="studioGrid">
        <aside className="panel left">
          <div className="kicker">01 · BUILD</div>
          <h1>Make your<br/><em>voxel.</em></h1>
          <p className="intro">Start with a recognizable 3D object, customize the presentation, then save a draft ready for the mint pipeline.</p>

          <label>OBJECT BLUEPRINT</label>
          <div className="shapeGrid">
            {SHAPES.map(([id, title]) => <button key={id} className={shape === id ? 'selected' : ''} onClick={() => setShape(id)}><span>◈</span>{title}</button>)}
          </div>

          <label>CREATION NAME</label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={80} />
          <label>DESCRIPTION</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500} />

          <div className="toolRow">
            <button className={autoRotate ? 'tool active' : 'tool'} onClick={() => setAutoRotate(v => !v)}>↻ Auto rotate</button>
            <button className="tool" onClick={exportDraft}>⇩ Export draft</button>
          </div>
        </aside>

        <section className="canvasPanel">
          <div className="canvasTop"><span>LIVE 3D PREVIEW</span><span>WEBGL · INTERACTIVE</span></div>
          <div className="canvas"><VoxelViewer key={shape + autoRotate} shape={shape} showcase={!autoRotate} /></div>
          <div className="canvasBottom"><div><strong>{selected}</strong><span>Interactive voxel geometry</span></div><div className="canvasHint">DRAG TO ORBIT · SCROLL TO ZOOM · CLICK BLOCKS</div></div>
        </section>

        <aside className="panel right">
          <div className="kicker">02 · PREPARE</div>
          <h2>NFT-ready<br/><em>by design.</em></h2>
          <div className="status"><span/> Draft workspace</div>
          <div className="specs">
            <div><span>FORMAT</span><strong>3D VOXEL</strong></div>
            <div><span>RENDERER</span><strong>THREE.JS</strong></div>
            <div><span>PREVIEW</span><strong>WEBGL</strong></div>
            <div><span>OWNERSHIP</span><strong>BLOCKCHAIN</strong></div>
          </div>
          <div className="pipeline">
            <div className="done"><i>✓</i><span><b>3D preview</b>Interactive object loaded</span></div>
            <div className="done"><i>✓</i><span><b>Draft metadata</b>Name and description saved locally</span></div>
            <div><i>03</i><span><b>Asset upload</b>GLB / image pipeline</span></div>
            <div><i>04</i><span><b>Wallet mint</b>Connect and mint on-chain</span></div>
          </div>
          <button className="mint" onClick={() => alert('Minting is the next blockchain integration step. Your draft is ready.')}>Continue to Mint <span>→</span></button>
          <small>Never enter a recovery phrase here. A wallet transaction will always require approval in your wallet.</small>
        </aside>
      </section>
    </main>
  );
}

const styles = `
*{box-sizing:border-box}body{margin:0;background:#05060a;color:#f6f7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.studio{min-height:100vh;background:radial-gradient(circle at 48% 42%,rgba(108,77,255,.10),transparent 31%),radial-gradient(circle at 90% 0,rgba(36,211,255,.055),transparent 24%),#05060a}.studioNav{height:74px;padding:0 3vw;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;background:rgba(5,6,10,.84);backdrop-filter:blur(18px);position:sticky;top:0;z-index:10}.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:13px;font-weight:950;letter-spacing:2px}.brand span span{color:#987cff}.mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#6847ff,#a57fff);box-shadow:0 0 28px rgba(117,79,255,.35)}.crumb{font-size:9px;letter-spacing:2px;color:#70778b}.crumb b{color:#373b4a;margin:0 8px}.navActions{display:flex;align-items:center;gap:9px}.navActions a,.navActions button{font:inherit;font-size:10px;font-weight:800;text-decoration:none;color:#aeb4c5;border:1px solid #282c3b;background:#0d0f16;padding:10px 13px;border-radius:9px}.navActions button{color:#fff;cursor:pointer}.studioGrid{min-height:calc(100vh - 74px);display:grid;grid-template-columns:330px minmax(400px,1fr) 300px;gap:1px;background:#191b25}.panel,.canvasPanel{background:#070910}.panel{padding:30px 24px}.kicker{color:#8970ff;font-size:9px;letter-spacing:2.5px;font-weight:950}.panel h1{font-size:43px;line-height:.88;letter-spacing:-2px;margin:15px 0}.panel h2{font-size:31px;line-height:.94;letter-spacing:-1.5px;margin:14px 0 12px}.panel em{font-style:normal;color:#997dff}.intro{font-size:11px;line-height:1.7;color:#7f8799;margin:0 0 26px}.panel label{display:block;margin:21px 0 8px;color:#666d7f;font-size:8px;letter-spacing:1.8px;font-weight:900}.shapeGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.shapeGrid button{padding:10px 8px;border:1px solid #222632;border-radius:8px;background:#0c0e15;color:#969dae;text-align:left;font-size:9px;cursor:pointer}.shapeGrid button span{color:#6951d7;margin-right:6px}.shapeGrid button:hover,.shapeGrid button.selected{border-color:#6951d7;color:#fff;background:#141126}.panel input,.panel textarea{width:100%;border:1px solid #282c3a;border-radius:9px;background:#0b0d14;color:#fff;padding:11px;font:inherit;font-size:10px;outline:none;resize:vertical}.panel input:focus,.panel textarea:focus{border-color:#7659ff}.toolRow{display:flex;gap:6px;margin-top:15px}.tool{flex:1;padding:10px;border:1px solid #292d3c;background:#0d0f16;color:#8f96a8;border-radius:8px;font-size:9px;cursor:pointer}.tool.active{color:#fff;border-color:#6650cf;background:#151129}.canvasPanel{display:flex;flex-direction:column;min-width:0}.canvasTop,.canvasBottom{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #1a1d27;color:#697083;font-size:8px;letter-spacing:1.6px;font-weight:900}.canvasBottom{border-top:1px solid #1a1d27;border-bottom:0;letter-spacing:0;text-transform:none}.canvasBottom div{display:flex;flex-direction:column;gap:4px}.canvasBottom strong{font-size:12px;color:#fff}.canvasBottom span{font-size:8px;color:#697083}.canvasHint{font-size:8px!important;letter-spacing:1.1px}.canvas{flex:1;min-height:520px;background:radial-gradient(circle at 50% 45%,rgba(108,75,255,.11),transparent 35%)}.canvas .voxelViewer{height:100%;min-height:520px;border-radius:0}.right{padding:30px 22px}.status{display:flex;align-items:center;gap:7px;color:#7e879a;font-size:9px;margin:18px 0}.status span{width:6px;height:6px;border-radius:50%;background:#7f62ff;box-shadow:0 0 10px #7f62ff}.specs{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #20232e;border-bottom:1px solid #20232e}.specs div{padding:13px 4px;border-bottom:1px solid #20232e}.specs div:nth-child(odd){border-right:1px solid #20232e}.specs div:nth-last-child(-n+2){border-bottom:0}.specs span{display:block;color:#626a7b;font-size:7px;letter-spacing:1.3px;margin-bottom:5px}.specs strong{font-size:9px}.pipeline{margin-top:25px;display:grid;gap:16px}.pipeline>div{display:flex;gap:10px;align-items:flex-start;color:#666e80;font-size:9px;line-height:1.45}.pipeline i{width:21px;height:21px;display:grid;place-items:center;border:1px solid #303442;border-radius:7px;font-style:normal;font-size:8px;flex:none}.pipeline .done{color:#9da5b6}.pipeline .done i{border-color:#5c48b4;background:#16112b;color:#a990ff}.pipeline span{display:flex;flex-direction:column;gap:2px}.pipeline b{color:#dce0eb;font-size:10px}.mint{width:100%;margin-top:27px;padding:13px;border:0;border-radius:10px;background:linear-gradient(135deg,#7656ff,#9a76ff);color:#fff;font-weight:950;font-size:11px;cursor:pointer;box-shadow:0 14px 35px rgba(112,78,255,.2)}.mint span{float:right}.right small{display:block;color:#555d70;font-size:8px;line-height:1.6;margin-top:12px}@media(max-width:1050px){.studioGrid{grid-template-columns:280px minmax(380px,1fr)}.right{display:none}}@media(max-width:720px){.studioNav{padding:0 14px}.crumb{display:none}.navActions a{display:none}.studioGrid{display:block}.panel.left{padding:22px 18px}.canvas{min-height:430px}.canvas .voxelViewer{min-height:430px}.panel h1{font-size:38px}.shapeGrid{grid-template-columns:repeat(4,1fr)}.shapeGrid button{font-size:0;text-align:center}.shapeGrid button span{margin:0;font-size:13px}.toolRow{padding-bottom:8px}}
`;
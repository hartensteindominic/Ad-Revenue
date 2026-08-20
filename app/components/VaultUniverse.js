'use client';

import { useMemo, useState } from 'react';
import VoxelViewer from './VoxelViewer';

const DROPS = [
  { name: 'Apex Nocturne', shape: 'car', type: 'Vehicle', rarity: 'Legendary', price: '0.42', creator: 'Vault Motors', seed: 'apex-nocturne', style: 'Obsidian chrome' },
  { name: 'Solara House', shape: 'villa', type: 'Architecture', rarity: 'Epic', price: '0.28', creator: 'Future Habitat', seed: 'solara-house', style: 'Warm stone + glass' },
  { name: 'Aurora Sentinel', shape: 'robot', type: 'Character', rarity: 'Rare', price: '0.16', creator: 'Machine Bloom', seed: 'aurora-sentinel', style: 'Iridescent alloy' },
  { name: 'Ember Fox', shape: 'fox', type: 'Creature', rarity: 'Rare', price: '0.11', creator: 'Wild Pixel', seed: 'ember-fox', style: 'Fur-textured voxel' },
  { name: 'Lunar Reliquary', shape: 'statue', type: 'Artifact', rarity: 'Legendary', price: '0.55', creator: 'Obscura Works', seed: 'lunar-reliquary', style: 'Marble + gold' },
  { name: 'Nebula Hauler', shape: 'ship', type: 'Sci-Fi', rarity: 'Epic', price: '0.31', creator: 'Orbit Foundry', seed: 'nebula-hauler', style: 'Industrial spacecraft' },
  { name: 'Mosslight Grove', shape: 'tree', type: 'Nature', rarity: 'Uncommon', price: '0.08', creator: 'Voxel Garden', seed: 'mosslight-grove', style: 'Bioluminescent forest' },
  { name: 'Glasswing Owl', shape: 'owl', type: 'Creature', rarity: 'Epic', price: '0.24', creator: 'Nocturne Lab', seed: 'glasswing-owl', style: 'Crystal feathers' },
  { name: 'Crimson Rally', shape: 'car', type: 'Vehicle', rarity: 'Rare', price: '0.13', creator: 'Redline Studio', seed: 'crimson-rally', style: 'Painted carbon' },
  { name: 'Skyline Atrium', shape: 'villa', type: 'Architecture', rarity: 'Legendary', price: '0.62', creator: 'Spatial Atelier', seed: 'skyline-atrium', style: 'Futurist glass' },
  { name: 'Deepforge Unit', shape: 'robot', type: 'Character', rarity: 'Epic', price: '0.21', creator: 'Deepforge', seed: 'deepforge-unit', style: 'Weathered machinery' },
  { name: 'Starfall Totem', shape: 'statue', type: 'Artifact', rarity: 'Rare', price: '0.14', creator: 'Ancient Future', seed: 'starfall-totem', style: 'Alien stone' },
];

const CATEGORIES = ['All', 'Vehicles', 'Architecture', 'Creatures', 'Characters', 'Artifacts', 'Nature', 'Sci-Fi'];
const CATEGORY_MAP = { Vehicles: 'Vehicle', Architecture: 'Architecture', Creatures: 'Creature', Characters: 'Character', Artifacts: 'Artifact', Nature: 'Nature', 'Sci-Fi': 'Sci-Fi' };

export default function VaultUniverse() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DROPS.filter((item) => {
      const categoryMatch = category === 'All' || item.type === CATEGORY_MAP[category];
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.style}`.toLowerCase();
      return categoryMatch && (!q || text.includes(q));
    });
  }, [category, query]);

  return (
    <main className="vaultUniverse">
      <div className="universeGlow glowA" />
      <div className="universeGlow glowB" />

      <nav className="vaultNav">
        <a className="brand" href="/">V<span>V</span>OXELVAULT</a>
        <div className="navLinks">
          <a href="#discover">Discover</a>
          <a href="#drops">Drops</a>
          <a href="#creators">Creators</a>
          <a href="#about">About</a>
        </div>
        <button className="walletButton" onClick={() => window.ethereum?.request?.({ method: 'eth_requestAccounts' })}>
          ◈ Connect Wallet
        </button>
      </nav>

      <section className="hero" id="discover">
        <div className="heroCopy">
          <div className="eyebrow"><i /> 3D DIGITAL OBJECTS · REAL OWNERSHIP</div>
          <h1>Objects worth <em>owning.</em></h1>
          <p>Explore original voxel sculptures, detailed environments, creatures, machines and impossible worlds. Inspect every object in real 3D before you collect it.</p>
          <div className="heroActions">
            <a href="#drops" className="primaryAction">Explore the Vault ↓</a>
            <a href="#creators" className="secondaryAction">Create a drop →</a>
          </div>
          <div className="heroStats"><span><b>12</b> showcase objects</span><span><b>8</b> visual families</span><span><b>3D</b> native</span></div>
        </div>
        <div className="heroViewer">
          <VoxelViewer shape="owl" seed="hero-glasswing" showcase interactive={false} label={false} />
          <div className="heroTag"><span>FEATURED</span><strong>Glasswing Owl</strong><small>Crystal-feather study · Epic</small></div>
        </div>
      </section>

      <section className="discover" id="drops">
        <div className="sectionHead">
          <div><div className="eyebrow">THE COLLECTION</div><h2>More than one kind of <em>beautiful.</em></h2></div>
          <p>From realistic vehicles and architecture to creatures, relics and science-fiction machines. Every piece gets its own seed, palette and geometry signature.</p>
        </div>
        <div className="toolbar">
          <div className="categoryBar">{CATEGORIES.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search objects, creators, styles..." /></label>
        </div>
        <div className="gallery">
          {visible.map((item, index) => (
            <article className="artCard" key={item.seed}>
              <button className="artVisual" onClick={() => setSelected(item)} aria-label={`Inspect ${item.name}`}>
                <VoxelViewer shape={item.shape} seed={item.seed} rarity={item.rarity} compact showcase interactive={false} label={false} />
                <span className="edition">{String(index + 1).padStart(2, '0')}</span>
                <span className="rarity">{item.rarity}</span>
              </button>
              <div className="artInfo"><div><h3>{item.name}</h3><span>{item.creator}</span></div><strong>{item.price} ETH</strong></div>
              <div className="artMeta"><span>{item.type}</span><span>{item.style}</span><button onClick={() => setSelected(item)}>Inspect 3D ↗</button></div>
            </article>
          ))}
        </div>
        {!visible.length && <div className="empty">No objects match that search. Try another style, creature, vehicle or world.</div>}
      </section>

      <section className="manifesto" id="about">
        <div><div className="eyebrow">THE VAULT PHILOSOPHY</div><h2>Not a grid of pictures.<br /><em>A world of objects.</em></h2></div>
        <div className="manifestoGrid"><div><b>01</b><strong>Real 3D</strong><p>Large interactive previews put geometry first. GLB/GLTF assets can become the centerpiece instead of an afterthought.</p></div><div><b>02</b><strong>Original variety</strong><p>Micro-voxel sculpture, realistic machines, architecture, creatures, fantasy, sci-fi, nature and abstract work can coexist.</p></div><div><b>03</b><strong>Wallet-native</strong><p>Wallet signing belongs at the transaction boundary. The interface should never pretend a purchase or mint happened.</p></div></div>
      </section>

      <section className="creatorBanner" id="creators"><div><div className="eyebrow">CREATOR STUDIO</div><h2>Build something people<br /><em>want to keep.</em></h2><p>Stage an original GLB/GLTF asset, attach metadata and royalties, then connect the real contract layer when the production network is configured.</p></div><a href="/marketplace">Open Creator Studio →</a></section>

      {selected && <div className="inspectBackdrop" role="dialog" aria-modal="true"><div className="inspectModal"><button className="close" onClick={() => setSelected(null)}>×</button><div className="inspectViewer"><VoxelViewer shape={selected.shape} seed={selected.seed} rarity={selected.rarity} interactive showcase={false} label={false} /></div><div className="inspectDetails"><div className="eyebrow">3D INSPECTION · {selected.rarity}</div><h2>{selected.name}</h2><p>{selected.style}. Created by <b>{selected.creator}</b>. Rotate, zoom and inspect the object before deciding whether it belongs in your vault.</p><div className="detailRows"><span>Category <b>{selected.type}</b></span><span>Edition <b>Vault Original</b></span><span>Price <b>{selected.price} ETH</b></span></div><button className="collect" onClick={() => window.ethereum?.request?.({ method: 'eth_requestAccounts' })}>Connect wallet to collect →</button></div></div></div>}

      <style jsx>{`
        .vaultUniverse{min-height:100vh;background:#05060b;color:#f7f8ff;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui,sans-serif;position:relative}.vaultUniverse *{box-sizing:border-box}.vaultUniverse a{text-decoration:none;color:inherit}.universeGlow{position:absolute;filter:blur(70px);border-radius:50%;pointer-events:none}.glowA{width:420px;height:420px;background:rgba(114,73,255,.15);top:90px;right:-100px}.glowB{width:360px;height:360px;background:rgba(25,198,255,.09);top:650px;left:-180px}.vaultNav{height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);position:relative;z-index:2;background:rgba(5,6,11,.7);backdrop-filter:blur(18px);position:sticky;top:0}.brand{font-size:18px;font-weight:900;letter-spacing:.16em}.brand span{color:#8d6bff}.navLinks{display:flex;gap:28px;color:#a9adbf;font-size:13px}.navLinks a:hover{color:#fff}.walletButton,.primaryAction,.secondaryAction,.creatorBanner>a{border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:12px 18px;background:rgba(255,255,255,.04);color:#fff;font-weight:750;cursor:pointer}.hero{max-width:1400px;margin:auto;min-height:690px;padding:70px 5vw 45px;display:grid;grid-template-columns:1fr 1.02fr;align-items:center;gap:25px;position:relative}.heroCopy{max-width:660px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#9298ae;font-weight:850;margin-bottom:20px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#8d6bff;box-shadow:0 0 18px #8d6bff;margin-right:9px}.hero h1{font-size:clamp(58px,7.4vw,112px);line-height:.9;letter-spacing:-.065em;margin:0 0 28px;font-weight:900}.hero h1 em,.sectionHead h2 em,.manifesto h2 em,.creatorBanner h2 em{font-family:Georgia,serif;font-weight:400;color:#a992ff}.hero p{font-size:17px;line-height:1.7;color:#aeb2c2;max-width:570px}.heroActions{display:flex;gap:10px;margin:30px 0}.primaryAction{background:#fff;color:#07080d;border-color:#fff}.heroStats{display:flex;gap:25px;color:#747a90;font-size:11px}.heroStats b{color:#f3f4f8;margin-right:5px}.heroViewer{height:570px;position:relative}.heroTag{position:absolute;right:12%;bottom:8%;padding:14px 17px;border:1px solid rgba(255,255,255,.12);background:rgba(7,8,14,.72);backdrop-filter:blur(18px);border-radius:14px;display:grid;gap:4px}.heroTag span{font-size:8px;color:#9c88ff;letter-spacing:.16em}.heroTag strong{font-size:15px}.heroTag small{color:#858a9c}.discover{max-width:1400px;margin:auto;padding:80px 5vw}.sectionHead{display:flex;justify-content:space-between;gap:40px;align-items:end}.sectionHead h2{font-size:clamp(35px,4.4vw,66px);letter-spacing:-.05em;line-height:.95;margin:0}.sectionHead>p{max-width:440px;color:#898ea2;line-height:1.65}.toolbar{display:flex;justify-content:space-between;gap:15px;margin:35px 0 20px;flex-wrap:wrap}.categoryBar{display:flex;gap:7px;flex-wrap:wrap}.categoryBar button{border:1px solid rgba(255,255,255,.09);background:#0a0c13;color:#818699;border-radius:999px;padding:9px 13px;cursor:pointer}.categoryBar button.selected{background:#f4f5f8;color:#080910;border-color:#f4f5f8}.search{width:290px;border:1px solid rgba(255,255,255,.1);background:#090b12;border-radius:999px;padding:10px 14px;display:flex;gap:8px;color:#757b8d}.search input{border:0;outline:0;background:transparent;color:#fff;width:100%}.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.artCard{background:linear-gradient(145deg,#0b0d15,#090a10);border:1px solid rgba(255,255,255,.08);border-radius:19px;overflow:hidden;transition:transform .25s,border-color .25s}.artCard:hover{transform:translateY(-5px);border-color:rgba(148,116,255,.38)}.artVisual{width:100%;height:300px;border:0;padding:0;background:#06070d;position:relative;cursor:pointer;display:block}.edition{position:absolute;left:14px;top:13px;color:#73798b;font-size:10px}.rarity{position:absolute;right:12px;top:12px;padding:6px 8px;border-radius:999px;background:rgba(5,6,11,.72);border:1px solid rgba(255,255,255,.1);font-size:9px;color:#d0c9ff}.artInfo{display:flex;justify-content:space-between;align-items:start;padding:15px 15px 8px}.artInfo h3{margin:0 0 4px;font-size:15px}.artInfo span{font-size:11px;color:#777d90}.artInfo strong{font-size:13px}.artMeta{display:flex;gap:7px;align-items:center;padding:0 15px 15px;color:#74798b;font-size:9px}.artMeta span:first-child{color:#a6aabd}.artMeta button{margin-left:auto;background:none;border:0;color:#9b84ff;cursor:pointer;font-size:10px}.empty{padding:70px;text-align:center;color:#777d90;border:1px dashed rgba(255,255,255,.12);border-radius:18px}.manifesto{max-width:1400px;margin:auto;padding:90px 5vw;border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:.9fr 1.1fr;gap:70px}.manifesto h2{font-size:clamp(42px,5vw,72px);line-height:.95;letter-spacing:-.05em;margin:0}.manifestoGrid{display:grid;gap:25px}.manifestoGrid>div{border-top:1px solid rgba(255,255,255,.09);padding-top:16px;display:grid;grid-template-columns:40px 1fr;column-gap:15px}.manifestoGrid b{color:#7766ad;font-size:11px}.manifestoGrid strong{font-size:17px}.manifestoGrid p{grid-column:2;color:#7d8396;line-height:1.6;margin:7px 0 0;font-size:13px}.creatorBanner{max-width:1400px;margin:30px auto 100px;padding:55px 5vw;border:1px solid rgba(255,255,255,.09);border-radius:25px;background:radial-gradient(circle at 85% 30%,rgba(124,87,255,.18),transparent 30%),#090b12;display:flex;align-items:end;justify-content:space-between;gap:30px}.creatorBanner h2{font-size:clamp(38px,4.8vw,68px);line-height:.95;letter-spacing:-.05em;margin:0 0 15px}.creatorBanner p{color:#858b9e;max-width:610px;line-height:1.6}.creatorBanner>a{white-space:nowrap}.inspectBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.76);backdrop-filter:blur(18px);z-index:20;display:grid;place-items:center;padding:24px}.inspectModal{width:min(1100px,96vw);max-height:90vh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#080a11;display:grid;grid-template-columns:1.1fr .9fr;position:relative;box-shadow:0 50px 160px rgba(0,0,0,.55)}.inspectViewer{height:620px}.inspectDetails{padding:55px 40px;display:flex;flex-direction:column;justify-content:center}.inspectDetails h2{font-size:46px;line-height:1;margin:0 0 15px;letter-spacing:-.05em}.inspectDetails p{color:#8d93a5;line-height:1.65}.detailRows{border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09);margin:25px 0;display:grid}.detailRows span{display:flex;justify-content:space-between;padding:12px 0;color:#72788b;font-size:11px}.detailRows b{color:#fff}.collect{border:0;border-radius:999px;padding:14px 18px;background:#fff;color:#06070b;font-weight:800;cursor:pointer}.close{position:absolute;right:15px;top:15px;z-index:3;border:1px solid rgba(255,255,255,.1);background:#11131b;color:#fff;border-radius:50%;width:36px;height:36px;font-size:22px;cursor:pointer}.vaultUniverse button{font:inherit}@media(max-width:980px){.navLinks{display:none}.hero{grid-template-columns:1fr;padding-top:45px}.heroViewer{height:470px}.gallery{grid-template-columns:repeat(2,1fr)}.manifesto{grid-template-columns:1fr;gap:35px}.creatorBanner{align-items:start;flex-direction:column}.inspectModal{grid-template-columns:1fr}.inspectViewer{height:440px}.inspectDetails{padding:30px}}@media(max-width:600px){.vaultNav{padding:0 18px}.walletButton{padding:9px 12px;font-size:11px}.hero,.discover,.manifesto{padding-left:18px;padding-right:18px}.hero h1{font-size:56px}.heroViewer{height:380px}.heroStats{gap:12px;flex-wrap:wrap}.sectionHead{display:block}.sectionHead>p{margin-top:20px}.gallery{grid-template-columns:1fr}.artVisual{height:320px}.search{width:100%}.creatorBanner{margin-left:18px;margin-right:18px;padding:35px 25px}.inspectBackdrop{padding:10px}.inspectDetails h2{font-size:34px}}
      `}</style>
    </main>
  );
}

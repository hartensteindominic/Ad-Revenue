'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCatalogWindow, CATALOG_SIZE } from '../../lib/catalog';
import { buyAsset, hasContracts } from '../../lib/blockchain';

const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

const PAGE_SIZE = 8;
const CATEGORIES = ['All', 'Vehicles', 'Architecture', 'Creatures', 'Characters', 'Artifacts', 'Nature', 'Sci-Fi'];
const CATEGORY_MAP = { Vehicles: 'Vehicle', Architecture: 'Architecture', Creatures: 'Creature', Characters: 'Character', Artifacts: 'Artifact', Nature: 'World' };
const HERO = { name: 'Obsidian Dragon', family: 'Dragon', rarity: 'Mythic', material: 'Crystal', shape: 'dragon', renderMode: 'voxel', seed: 'hero-obsidian-dragon', creator: 'Voxel Vault' };

export default function VaultUniverse() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState('');
  const [isMobile, setIsMobile] = useState(true);
  const [active3D, setActive3D] = useState('hero');
  const [items, setItems] = useState(() => getCatalogWindow(0, PAGE_SIZE));
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const sync = () => { const mobile = mq.matches; setIsMobile(mobile); if (mobile) setActive3D(null); else if (!selected) setActive3D('hero'); };
    sync(); mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, [selected]);

  useEffect(() => { setItems(getCatalogWindow(0, PAGE_SIZE)); setLoadedCount(PAGE_SIZE); }, [category, query]);

  const loadMore = useCallback(() => {
    if (loadedCount >= CATALOG_SIZE) return;
    const next = getCatalogWindow(loadedCount, PAGE_SIZE);
    setItems(prev => [...prev, ...next].slice(-24));
    setLoadedCount(c => Math.min(c + PAGE_SIZE, CATALOG_SIZE));
  }, [loadedCount]);

  useEffect(() => {
    const node = sentinelRef.current; if (!node) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) loadMore(); }, { rootMargin: '500px' });
    observer.observe(node); return () => observer.disconnect();
  }, [loadMore]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const mapped = CATEGORY_MAP[category];
      const categoryMatch = category === 'All' || item.type === mapped || (category === 'Nature' && ['World', 'Nature'].includes(item.type)) || (category === 'Sci-Fi' && ['ship', 'satellite', 'mech', 'robot', 'portal', 'alien'].includes(item.shape));
      const text = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material || ''} ${item.style || ''} ${item.family || ''} ${item.realityBasis || ''}`.toLowerCase();
      return categoryMatch && (!q || text.includes(q));
    });
  }, [items, category, query]);

  const openInspect = item => { setSelected(item); setActive3D('inspect'); };
  const closeInspect = () => { setSelected(null); setActive3D(isMobile ? null : 'hero'); };

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error('MetaMask was not detected. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0] || '';
      setWallet(address); setStatus(address ? `Connected ${address.slice(0, 6)}…${address.slice(-4)}` : 'Connection cancelled.');
    } catch (error) { setStatus(error?.message || 'Wallet connection failed.'); }
  }

  async function payCrypto() {
    if (!selected) return; setBusy(true);
    try {
      if (!hasContracts()) throw new Error('Crypto contracts are not configured on this deployment yet.');
      await buyAsset(selected.id, selected.price);
      setStatus(`Purchase submitted for ${selected.name}. Confirm it in your wallet.`);
    } catch (error) { setStatus(error?.shortMessage || error?.reason || error?.message || 'Crypto purchase failed.'); }
    finally { setBusy(false); }
  }

  async function payCard() {
    if (!selected) return; setBusy(true);
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: String(selected.id) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Checkout unavailable (${response.status})`);
      if (!data.url) throw new Error('Stripe did not return a checkout URL.');
      window.location.assign(data.url);
    } catch (error) { setStatus(error?.message || 'Card checkout failed.'); setBusy(false); }
  }

  function PreviewArt({ item, hero = false }) {
    const hue = (Number(item.seed?.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) || item.id || 1) % 360;
    return <div className={`previewArt ${hero ? 'previewHero' : ''}`} style={{ '--hue': hue }} aria-hidden="true">
      <div className="orb orbA"/><div className="orb orbB"/><div className="gridFloor"/>
      <div className="fakeObject"><div className="objectCore"/><div className="objectRing"/><div className="objectShard s1"/><div className="objectShard s2"/><div className="objectShard s3"/></div>
      <div className="previewLabel"><span>3D NATIVE</span><b>{item.rarity || 'Rare'}</b></div>
    </div>;
  }

  function LiveArtwork({ item, interactive = false }) {
    const props = { seed: item.seed, rarity: item.rarity, material: item.material, compact: !interactive, showcase: !interactive, interactive, label: false };
    return item.renderMode === 'voxel' ? <VoxelViewer shape={item.shape} {...props} /> : <ArtPreview family={item.family} {...props} />;
  }

  const heroIsLive = active3D === 'hero' && !isMobile && !selected;

  return <main className="vaultUniverse">
    <div className="ambient a1"/><div className="ambient a2"/>
    <nav className="vaultNav">
      <a className="brand" href="/">V<span>V</span>OXELVAULT</a>
      <div className="navLinks">
        <a href="/discover">Discover</a>
        <a href="/hunt">Hunt</a>
        <a href="#drops">Gallery</a>
        <a href="/trade">Trade</a>
        <a href="/marketplace">Marketplace</a>
      </div>
      <button className="walletButton" onClick={connectWallet}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect Wallet'}</button>
    </nav>

    <section className="hero" id="discover">
      <div className="heroCopy">
        <div className="eyebrow"><i/> 3D NFT SCAVENGER HUNTS · ETH OWNERSHIP</div>
        <h1>Objects worth <em>hunting.</em></h1>
        <p>Find 3D collectibles in the real world, clear multi-stop scavenger jobs, mint on Ethereum with ETH gas, then trade by tapping phones.</p>
        <div className="heroActions">
          <a className="primaryAction" href="/hunt">Start a scavenger job ↓</a>
          <a className="secondaryAction" href="/discover">Map drops →</a>
        </div>
        <div className="heroStats"><span><b>{CATALOG_SIZE.toLocaleString()}</b> forms</span><span><b>Hunts</b> live</span><span><b>ETH</b> mint</span><span><b>3D</b> native</span></div>
      </div>
      <div className="heroViewer">
        {heroIsLive ? <LiveArtwork item={HERO}/> : <PreviewArt item={HERO} hero/>}
        <div className="heroTag"><span>FEATURED · {isMobile ? 'TAP AN OBJECT FOR 3D' : 'LIVE 3D'}</span><strong>Obsidian Dragon</strong><small>Mythic · Crystal · Voxel Vault Original</small></div>
      </div>
    </section>

    <section className="discover" id="drops">
      <div className="sectionHead"><div><div className="eyebrow">THE COLLECTION</div><h2>Reality, <em>reimagined.</em></h2></div><p>{CATALOG_SIZE.toLocaleString()} deterministic forms. Lightweight cards keep browsing fast. Every object opens into a full 3D inspection.</p></div>
      <div className="toolbar"><div className="categoryBar">{CATEGORIES.map(name => <button key={name} className={category === name ? 'selected' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div><label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search objects, creators, materials…"/></label></div>
      <div className="gallery">
        {visible.map(item => <article className="artCard" key={`${item.id}-${item.seed}`}>
          <button className="artVisual" onClick={() => openInspect(item)} aria-label={`Open ${item.name} in 3D`}><PreviewArt item={item}/><span className="edition">{String(item.id).padStart(2, '0')}</span><span className="rarity">{item.rarity}</span><span className="inspectPill">↗ 3D</span></button>
          <div className="artInfo"><div><h3>{item.name}</h3><span>{item.creator}</span></div><strong>{item.price} ETH</strong></div>
          <div className="artMeta"><span>{item.type}</span><span>{item.style || item.material || 'Digital Object'}</span><button className="inspectLink" onClick={() => openInspect(item)}>Rotate in 3D ↗</button></div>
        </article>)}
      </div>
      <div ref={sentinelRef} className="loadMore">{loadedCount < CATALOG_SIZE ? `Scroll for more · ${loadedCount.toLocaleString()} / ${CATALOG_SIZE.toLocaleString()}` : `${CATALOG_SIZE.toLocaleString()} forms in the Vault`}</div>
      {!visible.length && <div className="empty">No objects match that search.</div>}
    </section>

    <section className="compatibility" id="about"><div><div className="eyebrow">3D COLLECTIBLE STANDARD</div><h2>One object.<br/><em>Many worlds.</em></h2><p>Build assets that can be staged as GLB/GLTF, described with rich metadata and connected to wallet ownership. The same canonical asset can be prepared for future metaverse integrations such as The Sandbox, where platform-specific publishing rules can be applied without changing the collector's Vault experience.</p></div><div className="compatGrid"><div><b>GLB / GLTF</b><span>Portable 3D asset staging</span></div><div><b>WALLET</b><span>Ownership-aware collecting</span></div><div><b>METADATA</b><span>Traits, rarity & provenance</span></div><div><b>SANDBOX READY</b><span>Integration profile for future publishing</span></div></div></section>

    <section className="creatorBanner" id="creators"><div><div className="eyebrow">CREATOR STUDIO</div><h2>Make the NFT people<br/><em>turn around twice.</em></h2><p>Stage GLB/GLTF files, traits, royalties and marketplace data. The goal is a collectible that looks great in the Vault and has a real asset pipeline behind it.</p></div><a className="primaryAction" href="/marketplace">Open Creator Studio →</a></section>

    {status && <div className="statusBar"><span>●</span>{status}<button onClick={() => setStatus('')}>×</button></div>}

    {selected && <div className="inspectBackdrop" role="dialog" aria-modal="true" aria-label={`${selected.name} 3D inspection`} onClick={e => e.target === e.currentTarget && closeInspect()}>
      <div className="inspectModal"><button className="close" onClick={closeInspect}>×</button><div className="inspectViewer"><LiveArtwork item={selected} interactive/></div><div className="inspectDetails">
        <div className="eyebrow">LIVE 3D INSPECTION · {selected.rarity}</div><h2>{selected.name}</h2><p>{selected.description || selected.style || 'Original 3D digital object'} · created by <b>{selected.creator}</b>.</p>
        <div className="detailRows"><span>Category <b>{selected.type}</b></span><span>Material <b>{selected.material || 'Digital'}</b></span><span>Reality basis <b>{selected.realityBasis || selected.family || selected.shape}</b></span><span>Price <b>{selected.price} ETH</b></span></div>
        <div className="payRow"><button className="collect" onClick={payCrypto} disabled={busy}>{busy ? 'Working…' : 'Collect with Crypto'}</button><button className="cardPay" onClick={payCard} disabled={busy}>{busy ? 'Working…' : 'Collect with Card'}</button></div>
        <button className="walletLink" onClick={connectWallet}>{wallet ? `Wallet ${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'Connect wallet →'}</button>
      </div></div>
    </div>}

    <style jsx>{`
      .vaultUniverse{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow:hidden;position:relative}.vaultUniverse *{box-sizing:border-box}.vaultUniverse button,.vaultUniverse a{font:inherit}.vaultUniverse button{color:inherit}.ambient{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}.a1{width:460px;width:460px;height:460px;right:-180px;top:140px;background:rgba(117,76,255,.16)}.a2{width:360px;height:360px;left:-190px;top:900px;background:rgba(25,191,255,.07)}
      .vaultNav{height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.82);backdrop-filter:blur(18px);position:sticky;top:0;z-index:50}.brand{font-size:18px;font-weight:950;letter-spacing:.15em;text-decoration:none;color:#fff}.brand span{color:#9b7cff}.navLinks{display:flex;gap:28px;color:#9da3b5;font-size:13px}.navLinks a{text-decoration:none;color:inherit}.navLinks a:hover{color:#fff}.walletButton,.secondaryAction,.categoryBar button,.inspectLink,.walletLink{border:1px solid rgba(255,255,255,.14);background:#0b0d15;border-radius:999px;cursor:pointer}.walletButton{padding:11px 16px;font-weight:800}.hero{max-width:1400px;margin:auto;min-height:690px;padding:72px 5vw 56px;display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center}.heroCopy{max-width:660px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#8e95aa;font-weight:850;margin-bottom:17px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#a183ff;box-shadow:0 0 18px #a183ff;margin-right:9px}.hero h1{font-size:clamp(58px,7.4vw,112px);line-height:.9;letter-spacing:-.065em;margin:0 0 26px;font-weight:950}.hero h1 em,.sectionHead h2 em,.compatibility h2 em,.creatorBanner h2 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}.hero p{font-size:17px;line-height:1.7;color:#abb0c0;max-width:590px}.heroActions{display:flex;gap:10px;margin:30px 0}.primaryAction{display:inline-flex;align-items:center;justify-content:center;padding:13px 19px;border-radius:999px;background:#fff;color:#07080c!important;border:1px solid #fff;text-decoration:none;font-weight:900}.secondaryAction{display:inline-flex;align-items:center;justify-content:center;padding:13px 19px;text-decoration:none}.heroStats{display:flex;gap:24px;color:#70778a;font-size:11px;flex-wrap:wrap}.heroStats b{color:#fff;margin-right:5px}.heroViewer{height:520px;border:1px solid rgba(255,255,255,.11);border-radius:30px;overflow:hidden;position:relative;background:radial-gradient(circle at 50% 40%,rgba(108,72,255,.18),transparent 48%),#080a12;box-shadow:0 30px 100px rgba(0,0,0,.35)}.heroTag{position:absolute;left:20px;right:20px;bottom:18px;padding:13px 15px;border-radius:15px;background:rgba(5,6,11,.76);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);display:grid;gap:3px}.heroTag span{font-size:9px;letter-spacing:.18em;color:#9f88ff;font-weight:900}.heroTag strong{font-size:16px}.heroTag small{color:#858b9d}
      .previewArt{height:100%;width:100%;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 42%,hsl(var(--hue) 75% 45% / .22),transparent 30%),radial-gradient(circle at 30% 70%,rgba(35,215,255,.1),transparent 35%),linear-gradient(145deg,#0a0c15,#05060b 70%)}.previewHero{min-height:100%}.orb{position:absolute;border-radius:50%;filter:blur(35px)}.orbA{width:45%;aspect-ratio:1;left:10%;top:8%;background:hsl(var(--hue) 90% 60% / .18)}.orbB{width:35%;aspect-ratio:1;right:8%;bottom:10%;background:rgba(35,210,255,.13)}.gridFloor{position:absolute;left:-20%;right:-20%;bottom:-30%;height:55%;transform:perspective(300px) rotateX(60deg);background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(to top,black,transparent)}.fakeObject{position:absolute;width:42%;aspect-ratio:1;left:29%;top:22%;transform:rotate(-13deg) rotateX(12deg);filter:drop-shadow(0 30px 35px rgba(0,0,0,.55));animation:floatObject 5s ease-in-out infinite}.objectCore{position:absolute;inset:18%;border-radius:30%;background:linear-gradient(135deg,hsl(var(--hue) 85% 72%),hsl(var(--hue) 75% 32%) 48%,#080910 100%);box-shadow:inset -20px -25px 40px rgba(0,0,0,.4),inset 12px 12px 25px rgba(255,255,255,.2),0 0 55px hsl(var(--hue) 90% 55% / .28);transform:skewY(-8deg)}.objectRing{position:absolute;inset:7%;border:3px solid rgba(255,255,255,.25);border-radius:34%;transform:rotate(25deg);box-shadow:0 0 25px hsl(var(--hue) 90% 60% / .25)}.objectShard{position:absolute;width:18%;height:42%;background:linear-gradient(180deg,rgba(255,255,255,.55),hsl(var(--hue) 75% 40%));clip-path:polygon(50% 0,100% 80%,50% 100%,0 80%);filter:drop-shadow(0 10px 15px rgba(0,0,0,.4))}.s1{left:-3%;top:22%;transform:rotate(-25deg)}.s2{right:-3%;top:5%;transform:rotate(35deg)}.s3{right:12%;bottom:-5%;transform:rotate(18deg)}@keyframes floatObject{0%,100%{transform:translateY(0) rotate(-13deg) rotateX(12deg)}50%{transform:translateY(-12px) rotate(-8deg) rotateX(15deg)}}.previewLabel{position:absolute;right:14px;top:14px;display:flex;gap:7px;align-items:center}.previewLabel span,.previewLabel b{font-size:8px;letter-spacing:.12em;padding:6px 8px;border-radius:999px;background:rgba(5,6,11,.72);border:1px solid rgba(255,255,255,.1)}.previewLabel b{color:#c4b6ff}
      .discover{max-width:1400px;margin:auto;padding:75px 5vw}.sectionHead{display:flex;justify-content:space-between;gap:40px;align-items:end;margin-bottom:28px}.sectionHead h2,.compatibility h2,.creatorBanner h2{font-size:clamp(38px,5vw,70px);line-height:.95;letter-spacing:-.05em;margin:0}.sectionHead>p{max-width:400px;color:#81879a;font-size:13px;line-height:1.6}.toolbar{display:flex;gap:12px;justify-content:space-between;align-items:center;margin-bottom:18px}.categoryBar{display:flex;gap:7px;overflow:auto;padding-bottom:3px}.categoryBar button{padding:9px 13px;white-space:nowrap;color:#9298aa;font-size:11px}.categoryBar button.selected{background:#fff;color:#08090e;border-color:#fff;font-weight:850}.search{min-width:250px;border:1px solid rgba(255,255,255,.12);background:#090b12;border-radius:999px;padding:10px 14px;display:flex;gap:8px;color:#70778b}.search input{background:transparent;border:0;outline:0;color:#fff;width:100%;font-size:12px}.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.artCard{min-width:0}.artVisual{display:block;width:100%;height:320px;padding:0;border:1px solid rgba(255,255,255,.09);border-radius:20px;overflow:hidden;position:relative;background:#090b12;cursor:pointer}.artVisual:hover{border-color:rgba(174,150,255,.45);transform:translateY(-2px);transition:.2s}.edition,.rarity,.inspectPill{position:absolute;top:12px;border:1px solid rgba(255,255,255,.1);background:rgba(5,6,11,.7);backdrop-filter:blur(10px);border-radius:999px;padding:6px 8px;font-size:8px;letter-spacing:.08em}.edition{left:12px;color:#777e91}.rarity{right:12px;color:#c0b0ff}.inspectPill{left:12px;bottom:12px;top:auto;color:#fff;font-weight:850}.artInfo{display:flex;justify-content:space-between;gap:10px;padding:14px 2px 8px}.artInfo h3{font-size:15px;margin:0 0 3px}.artInfo span{color:#747b8f;font-size:10px}.artInfo strong{font-size:11px;white-space:nowrap}.artMeta{display:flex;align-items:center;gap:8px;color:#6f7587;font-size:9px}.artMeta>span:nth-child(2){color:#a2a7b7}.inspectLink{margin-left:auto;padding:7px 9px;font-size:9px;color:#fff}.loadMore{text-align:center;color:#646b7e;font-size:10px;padding:40px}.empty{text-align:center;padding:70px;color:#7e8497}
      .compatibility{max-width:1400px;margin:auto;padding:90px 5vw;display:grid;grid-template-columns:1fr 1fr;gap:70px;border-top:1px solid rgba(255,255,255,.07)}.compatibility p,.creatorBanner p{color:#969cad;line-height:1.7;max-width:620px}.compatGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.compatGrid div{padding:22px;border:1px solid rgba(255,255,255,.09);border-radius:18px;background:rgba(255,255,255,.025)}.compatGrid b{display:block;color:#b29dff;font-size:10px;letter-spacing:.15em;margin-bottom:9px}.compatGrid span{color:#a1a6b5;font-size:12px}.creatorBanner{max-width:1400px;margin:30px auto 90px;padding:55px 5vw;border:1px solid rgba(255,255,255,.09);border-radius:28px;background:radial-gradient(circle at 80% 50%,rgba(115,76,255,.18),transparent 45%),#080a11;display:flex;justify-content:space-between;align-items:center;gap:30px}.creatorBanner p{margin-top:18px}.statusBar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100;background:#11141e;border:1px solid rgba(255,255,255,.14);padding:11px 13px;border-radius:999px;display:flex;align-items:center;gap:9px;font-size:11px;box-shadow:0 20px 50px rgba(0,0,0,.4)}.statusBar span{color:#9b7cff}.statusBar button{border:0;background:transparent;cursor:pointer;color:#8e94a7}.inspectBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(14px);z-index:200;display:grid;place-items:center;padding:18px}.inspectModal{width:min(1180px,100%);max-height:min(820px,94vh);overflow:auto;background:#080a11;border:1px solid rgba(255,255,255,.13);border-radius:28px;display:grid;grid-template-columns:1.25fr .75fr;position:relative;box-shadow:0 40px 120px rgba(0,0,0,.65)}.inspectViewer{min-height:620px;background:#05060b;border-right:1px solid rgba(255,255,255,.08)}.inspectDetails{padding:46px 38px;align-self:center}.inspectDetails h2{font-size:clamp(36px,5vw,64px);line-height:.92;letter-spacing:-.05em;margin:0 0 18px}.inspectDetails p{color:#9da3b3;line-height:1.7}.detailRows{border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);margin:25px 0}.detailRows span{display:flex;justify-content:space-between;padding:11px 0;color:#72798b;font-size:10px}.detailRows b{color:#fff;text-align:right}.payRow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.collect,.cardPay{border-radius:12px;padding:13px;border:1px solid rgba(255,255,255,.14);cursor:pointer;font-weight:850}.collect{background:#fff;color:#07080c}.cardPay{background:#141722;color:#fff}.collect:disabled,.cardPay:disabled{opacity:.55;cursor:wait}.walletLink{margin-top:10px;width:100%;padding:10px}.close{position:absolute;right:14px;top:14px;z-index:3;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:#0b0d14;color:#fff;font-size:22px;cursor:pointer}
      @media(max-width:900px){.navLinks{display:none}.hero{grid-template-columns:1fr;padding-top:46px}.heroViewer{height:430px}.gallery{grid-template-columns:repeat(2,1fr)}.sectionHead,.compatibility,.creatorBanner{grid-template-columns:1fr;display:grid}.toolbar{display:block}.search{margin-top:10px}.inspectModal{grid-template-columns:1fr}.inspectViewer{min-height:55vh;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.inspectDetails{padding:28px}.creatorBanner{align-items:start}}
      @media(max-width:600px){.vaultNav{height:64px;padding:0 16px}.brand{font-size:14px}.walletButton{font-size:10px;padding:9px 11px}.hero{padding:42px 16px 28px;display:block;min-height:auto}.hero h1{font-size:54px}.hero p{font-size:14px}.heroViewer{height:390px;margin-top:28px;border-radius:22px}.heroStats{gap:12px}.discover{padding:55px 16px}.sectionHead{margin-bottom:22px}.sectionHead h2{font-size:42px}.categoryBar{margin-right:-16px;padding-right:16px}.gallery{grid-template-columns:1fr;gap:18px}.artVisual{height:360px}.compatibility{padding:65px 16px;gap:30px}.compatGrid{grid-template-columns:1fr}.creatorBanner{margin:10px 16px 60px;padding:34px 22px;border-radius:22px}.creatorBanner h2{font-size:42px}.inspectBackdrop{padding:8px}.inspectModal{border-radius:22px;max-height:96vh}.inspectViewer{min-height:46vh}.inspectDetails{padding:24px 18px}.payRow{grid-template-columns:1fr}.statusBar{max-width:calc(100% - 24px);white-space:normal;text-align:center}.navLinks{display:none}}
    `}</style>
  </main>;
}

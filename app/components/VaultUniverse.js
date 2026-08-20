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

export default function VaultUniverse() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState('');
  const [mobile, setMobile] = useState(true);
  const [desktop3D, setDesktop3D] = useState(false);
  const [items, setItems] = useState(() => getCatalogWindow(0, PAGE_SIZE));
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const sync = () => { const isMobile = mq.matches; setMobile(isMobile); setDesktop3D(!isMobile); };
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    setItems(getCatalogWindow(0, PAGE_SIZE));
    setLoadedCount(PAGE_SIZE);
  }, [category, query]);

  const loadMore = useCallback(() => {
    if (loadedCount >= CATALOG_SIZE) return;
    const next = getCatalogWindow(loadedCount, PAGE_SIZE);
    setItems(prev => [...prev, ...next].slice(-24));
    setLoadedCount(c => Math.min(c + PAGE_SIZE, CATALOG_SIZE));
  }, [loadedCount]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) loadMore(); }, { rootMargin: '500px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const mapped = CATEGORY_MAP[category];
      const categoryMatch = category === 'All' || item.type === mapped || (category === 'Nature' && ['World', 'Nature'].includes(item.type)) || (category === 'Sci-Fi' && ['ship', 'satellite', 'mech', 'robot', 'portal', 'alien'].includes(item.shape));
      const haystack = `${item.name} ${item.creator} ${item.type} ${item.rarity} ${item.material || ''} ${item.style || ''} ${item.family || ''} ${item.realityBasis || ''}`.toLowerCase();
      return categoryMatch && (!q || haystack.includes(q));
    });
  }, [items, category, query]);

  const openInspect = item => setSelected(item);
  const closeInspect = () => setSelected(null);

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error('MetaMask was not detected. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0] || '';
      setWallet(address);
      setStatus(address ? `Connected ${address.slice(0, 6)}…${address.slice(-4)}` : 'Connection cancelled.');
    } catch (error) { setStatus(error?.message || 'Wallet connection failed.'); }
  }

  async function payCrypto() {
    if (!selected) return;
    setBusy(true);
    try {
      if (!hasContracts()) throw new Error('Crypto contracts are not configured on this deployment yet.');
      await buyAsset(selected.id, selected.price);
      setStatus(`Purchase submitted for ${selected.name}. Confirm it in your wallet.`);
    } catch (error) { setStatus(error?.shortMessage || error?.reason || error?.message || 'Crypto purchase failed.'); }
    finally { setBusy(false); }
  }

  async function payCard() {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: String(selected.id) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Checkout unavailable (${response.status})`);
      if (!data.url) throw new Error('Stripe did not return a checkout URL.');
      window.location.assign(data.url);
    } catch (error) { setStatus(error?.message || 'Card checkout failed.'); setBusy(false); }
  }

  function Artwork({ item, interactive = false, hero = false }) {
    if (!desktop3D && !interactive) return <PreviewArt item={item} hero={hero} />;
    const common = { seed: item.seed, rarity: item.rarity, material: item.material, compact: !interactive, showcase: !interactive, interactive, label: false };
    return item.renderMode === 'voxel'
      ? <VoxelViewer shape={item.shape} {...common} />
      : <ArtPreview family={item.family} {...common} />;
  }

  return (
    <main className="vaultUniverse">
      <div className="glow glowOne" /><div className="glow glowTwo" />
      <nav className="vaultNav">
        <a className="brand" href="/">V<span>V</span>OXELVAULT</a>
        <div className="navLinks"><a href="#discover">Discover</a><a href="#drops">Drops</a><a href="#creators">Creators</a><a href="#about">About</a></div>
        <button type="button" className="walletButton" onClick={connectWallet}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect Wallet'}</button>
      </nav>

      <section className="hero" id="discover">
        <div className="heroCopy">
          <div className="eyebrow"><i /> 3D DIGITAL OBJECTS · REAL OWNERSHIP</div>
          <h1>Objects worth <em>owning.</em></h1>
          <p>Explore original voxel art, sculptural 3D pieces, creatures, machines, architecture and impossible forms. Inspect every object in real 3D before you collect it.</p>
          <div className="heroActions"><a className="primaryAction" href="#drops">Explore the Vault ↓</a><a className="secondaryAction" href="#creators">Create a drop →</a></div>
          <div className="heroStats"><span><b>{CATALOG_SIZE.toLocaleString()}</b> forms</span><span><b>8</b> art families</span><span><b>14</b> materials</span><span><b>3D</b> native</span></div>
        </div>
        <div className="heroViewer">
          <Artwork item={{ name: 'Obsidian Dragon', family: 'Dragon', rarity: 'Mythic', material: 'Crystal', shape: 'dragon', renderMode: 'voxel', seed: 'hero-obsidian-dragon' }} hero />
          <div className="heroTag"><span>FEATURED</span><strong>Obsidian Dragon</strong><small>Mythic · Crystal</small></div>
        </div>
      </section>

      <section className="discover" id="drops">
        <div className="sectionHead"><div><div className="eyebrow">THE COLLECTION</div><h2>More than one kind of <em>beautiful.</em></h2></div><p>{CATALOG_SIZE.toLocaleString()} forms. Browse safely, then open one object for full 3D inspection.</p></div>
        <div className="toolbar">
          <div className="categoryBar">{CATEGORIES.map(name => <button type="button" key={name} className={category === name ? 'selected' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search objects, creators, styles..." /></label>
        </div>
        <div className="gallery">
          {visible.map((item, index) => (
            <article className="artCard" key={`${item.id}-${item.seed}`}>
              <button type="button" className="artVisual" onClick={() => openInspect(item)} aria-label={`Inspect ${item.name}`}>
                {desktop3D && index === 0 ? <Artwork item={item} /> : <PreviewArt item={item} />}
                <span className="edition">{String(item.id).padStart(2, '0')}</span><span className="rarity">{item.rarity}</span>
              </button>
              <div className="artInfo"><div><h3>{item.name}</h3><span>{item.creator}</span></div><strong>{item.price} ETH</strong></div>
              <div className="artMeta"><span>{item.type}</span><span>{item.style || item.material || 'Digital Object'}</span><button type="button" className="inspectLink" onClick={() => openInspect(item)}>Inspect 3D ↗</button></div>
            </article>
          ))}
        </div>
        <div ref={sentinelRef} className="loadMore">{loadedCount < CATALOG_SIZE ? `Scroll for more · ${loadedCount.toLocaleString()} / ${CATALOG_SIZE.toLocaleString()}` : `${CATALOG_SIZE.toLocaleString()} forms in the vault`}</div>
        {!visible.length && <div className="empty">No objects match that search.</div>}
      </section>

      <section className="manifesto" id="about"><div><div className="eyebrow">THE VAULT PHILOSOPHY</div><h2>Not a grid of pictures.<br /><em>A world of objects.</em></h2></div><div className="manifestoGrid"><div><b>01</b><strong>Real 3D</strong><p>Interactive previews put geometry first. Open any piece for the full viewer.</p></div><div><b>02</b><strong>Original variety</strong><p>Real-world inspiration transformed into distinctive voxel, sculpted and stylized digital objects.</p></div><div><b>03</b><strong>Pay your way</strong><p>Crypto through the configured marketplace contract or card through Stripe for published assets.</p></div></div></section>
      <section className="creatorBanner" id="creators"><div><div className="eyebrow">CREATOR STUDIO</div><h2>Build something people<br /><em>want to keep.</em></h2><p>Stage GLB/GLTF assets, metadata and royalties, then connect the contract layer when ready.</p></div><a className="primaryAction" href="/marketplace">Open Creator Studio →</a></section>
      {status && <div className="statusBar"><span>●</span>{status}<button type="button" onClick={() => setStatus('')}>×</button></div>}

      {selected && <div className="inspectBackdrop" role="dialog" aria-modal="true" aria-label={`${selected.name} 3D inspection`} onClick={e => e.target === e.currentTarget && closeInspect()}><div className="inspectModal"><button type="button" className="close" onClick={closeInspect} aria-label="Close 3D inspection">×</button><div className="inspectViewer"><Artwork item={selected} interactive /></div><div className="inspectDetails"><div className="eyebrow">3D INSPECTION · {selected.rarity}</div><h2>{selected.name}</h2><p>{selected.description || selected.style || 'Original 3D digital object'}. Created by <b>{selected.creator}</b>.</p><div className="detailRows"><span>Category <b>{selected.type}</b></span><span>Style <b>{selected.style || selected.material || '3D'}</b></span><span>Reality basis <b>{selected.realityBasis || selected.family || selected.shape}</b></span><span>Price <b>{selected.price} ETH</b></span></div><div className="payRow"><button type="button" className="collect" onClick={payCrypto} disabled={busy}>{busy ? 'Working…' : 'Pay with Crypto'}</button><button type="button" className="cardPay" onClick={payCard} disabled={busy}>{busy ? 'Working…' : 'Pay with Card'}</button></div><button type="button" className="walletLink" onClick={connectWallet}>{wallet ? `Wallet ${wallet.slice(0, 6)}…` : 'Connect wallet →'}</button></div></div></div>}

      <style jsx>{`
        .vaultUniverse{min-height:100vh;background:#05060b;color:#f7f8ff;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui,sans-serif;position:relative}.vaultUniverse *{box-sizing:border-box}.vaultUniverse button,.vaultUniverse a{font:inherit}.vaultUniverse a{text-decoration:none;color:inherit}.glow{position:absolute;border-radius:999px;filter:blur(80px);pointer-events:none}.glowOne{width:420px;height:420px;right:-120px;top:80px;background:rgba(126,88,255,.16)}.glowTwo{width:360px;height:360px;left:-180px;top:720px;background:rgba(32,198,255,.08)}
        .vaultNav{height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.78);backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}.brand{font-size:18px;font-weight:900;letter-spacing:.16em}.brand span{color:#9b7cff}.navLinks{display:flex;gap:28px;color:#a9adbf;font-size:13px}.navLinks a:hover{color:#fff}.walletButton,.primaryAction,.secondaryAction,.categoryBar button,.inspectLink,.walletLink{border:1px solid rgba(255,255,255,.14);border-radius:999px;background:#0b0d15;color:#fff;cursor:pointer}.walletButton{padding:11px 17px;font-weight:800}.hero{max-width:1400px;margin:auto;min-height:680px;padding:70px 5vw 50px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:32px}.heroCopy{max-width:660px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#9298ae;font-weight:850;margin-bottom:18px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#9b7cff;box-shadow:0 0 18px #9b7cff;margin-right:9px}.hero h1{font-size:clamp(58px,7.5vw,112px);line-height:.9;letter-spacing:-.065em;margin:0 0 26px;font-weight:900}.hero h1 em,.sectionHead h2 em,.manifesto h2 em,.creatorBanner h2 em{font-family:Georgia,serif;font-weight:400;color:#aa96ff}.hero p{font-size:17px;line-height:1.7;color:#aeb2c2;max-width:590px}.heroActions{display:flex;gap:10px;margin:30px 0}.primaryAction,.secondaryAction{display:inline-flex;align-items:center;justify-content:center;padding:13px 19px;font-weight:850}.primaryAction{background:#fff;color:#080910!important;border-color:#fff}.secondaryAction{background:#0b0d15}.heroStats{display:flex;gap:25px;color:#74798c;font-size:11px}.heroStats b{color:#fff;margin-right:5px}.heroViewer{height:520px;border:1px solid rgba(255,255,255,.1);border-radius:28px;overflow:hidden;position:relative;background:radial-gradient(circle at 50% 40%,rgba(111,75,255,.18),transparent 45%),#080a12}.heroTag{position:absolute;left:20px;bottom:18px;background:rgba(5,6,11,.75);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:11px 14px;backdrop-filter:blur(12px)}.heroTag span{display:block;color:#9b7cff;font-size:9px;letter-spacing:.18em;font-weight:900}.heroTag strong{display:block;font-size:15px;margin-top:4px}.heroTag small{color:#8f95a7}.discover,.manifesto,.creatorBanner{max-width:1400px;margin:auto;padding:75px 5vw}.sectionHead{display:flex;justify-content:space-between;gap:30px;align-items:end}.sectionHead h2,.manifesto h2,.creatorBanner h2{font-size:clamp(38px,5vw,70px);line-height:.95;letter-spacing:-.05em;margin:0}.sectionHead p{max-width:430px;color:#858b9d;line-height:1.6;font-size:13px}.toolbar{display:flex;gap:14px;align-items:center;justify-content:space-between;margin:35px 0 22px}.categoryBar{display:flex;gap:7px;flex-wrap:wrap}.categoryBar button{padding:9px 13px;font-size:11px}.categoryBar button.selected{background:#9b7cff;border-color:#9b7cff;color:#080910;font-weight:900}.search{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:#0a0c13;padding:0 13px;height:38px;min-width:250px}.search span{color:#858b9d}.search input{border:0;outline:0;background:transparent;color:#fff;width:100%;font-size:12px}.search input::placeholder{color:#666d80}.gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.artCard{min-width:0}.artVisual{width:100%;aspect-ratio:1/1;border:1px solid rgba(255,255,255,.1);border-radius:19px;overflow:hidden;position:relative;padding:0;background:#090b13;color:#fff;cursor:pointer;text-align:left}.artVisual:focus-visible{outline:2px solid #9b7cff;outline-offset:3px}.edition,.rarity{position:absolute;top:11px;padding:5px 8px;border-radius:999px;background:rgba(5,6,11,.7);border:1px solid rgba(255,255,255,.1);font-size:8px;font-weight:900;letter-spacing:.12em}.edition{left:11px;color:#969cad}.rarity{right:11px;color:#c0aaff}.artInfo{display:flex;justify-content:space-between;gap:10px;padding:13px 2px 5px}.artInfo h3{font-size:14px;margin:0 0 4px}.artInfo span{font-size:10px;color:#777e91}.artInfo>strong{font-size:11px;white-space:nowrap}.artMeta{display:flex;gap:7px;align-items:center;color:#656c7e;font-size:9px;padding:0 2px}.artMeta>span{padding:4px 7px;border:1px solid rgba(255,255,255,.08);border-radius:999px}.inspectLink{margin-left:auto;padding:5px 8px;background:#0c0f18;font-size:9px}.loadMore{text-align:center;padding:40px;color:#646b7c;font-size:11px}.empty{text-align:center;padding:80px;color:#888fa0}.manifesto{border-top:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr;gap:60px}.manifestoGrid{display:grid;gap:20px}.manifestoGrid>div{padding:18px 0;border-top:1px solid rgba(255,255,255,.08)}.manifestoGrid b{color:#9b7cff;margin-right:15px;font-size:10px}.manifestoGrid strong{font-size:15px}.manifestoGrid p,.creatorBanner p{color:#858b9d;line-height:1.6;font-size:12px;margin:8px 0 0}.creatorBanner{margin-bottom:50px;border:1px solid rgba(255,255,255,.1);border-radius:25px;background:linear-gradient(135deg,rgba(120,80,255,.13),rgba(20,25,45,.2));display:flex;justify-content:space-between;align-items:center;gap:30px}.statusBar{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:100;background:#0b0d15;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:10px 14px;color:#d7dae5;font-size:11px;box-shadow:0 15px 50px rgba(0,0,0,.4)}.statusBar span{color:#9b7cff;margin-right:8px}.statusBar button{border:0;background:transparent;color:#777f91;margin-left:8px;cursor:pointer}.inspectBackdrop{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.78);backdrop-filter:blur(14px);display:grid;place-items:center;padding:20px}.inspectModal{width:min(1120px,100%);max-height:92vh;overflow:auto;background:#080a11;border:1px solid rgba(255,255,255,.13);border-radius:24px;display:grid;grid-template-columns:1.2fr .8fr;position:relative;box-shadow:0 30px 100px rgba(0,0,0,.65)}.close{position:absolute;right:14px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:#10131d;color:#fff;font-size:25px;cursor:pointer;z-index:3}.inspectViewer{min-height:600px;background:#05070d}.inspectDetails{padding:55px 34px 30px}.inspectDetails h2{font-size:clamp(34px,4vw,60px);line-height:.95;letter-spacing:-.05em;margin:0 0 15px}.inspectDetails p{color:#9298aa;line-height:1.65;font-size:13px}.detailRows{border-top:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1);margin:24px 0}.detailRows span{display:flex;justify-content:space-between;gap:15px;padding:10px 0;color:#73798a;font-size:10px}.detailRows b{color:#fff;text-align:right}.payRow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.payRow button{min-height:46px;border-radius:12px;font-weight:900;cursor:pointer}.collect{border:1px solid #fff;background:#fff;color:#07080d}.cardPay{border:1px solid rgba(255,255,255,.14);background:#121520;color:#fff}.payRow button:disabled{opacity:.55;cursor:wait}.walletLink{margin-top:9px;padding:10px 14px;background:#0c0f18;font-size:10px}.previewArt{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 50% 40%,rgba(132,90,255,.25),transparent 42%),linear-gradient(145deg,#101322,#070910)}.previewGlow{position:absolute;inset:15%;border-radius:42% 58% 48% 52%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.4),transparent 12%),linear-gradient(145deg,rgba(155,124,255,.95),rgba(33,181,226,.48) 45%,rgba(5,6,11,.95));filter:blur(.2px);transform:rotate(-12deg) skewY(-4deg);box-shadow:inset -30px -35px 55px rgba(0,0,0,.45),inset 15px 15px 35px rgba(255,255,255,.16),0 20px 55px rgba(126,88,255,.3)}.previewGrid{position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:24px 24px;mask-image:linear-gradient(transparent 0%,#000 30%,#000 75%,transparent 100%);opacity:.45}.previewLabel{position:absolute;left:18px;bottom:16px;font-size:9px;letter-spacing:.14em;color:#d7d1ff;text-transform:uppercase}.previewArt:before,.previewArt:after{content:'';position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.13);width:65%;height:65%;left:17%;top:17%;transform:rotate(35deg)}.previewArt:after{width:45%;height:85%;left:27%;top:7%;transform:rotate(-38deg)}
        @media(max-width:900px){.navLinks{display:none}.hero{grid-template-columns:1fr;padding-top:45px}.heroViewer{height:430px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.manifesto{grid-template-columns:1fr}.toolbar{align-items:stretch;flex-direction:column}.search{width:100%}.creatorBanner{display:block}.creatorBanner .primaryAction{margin-top:20px}.inspectModal{grid-template-columns:1fr}.inspectViewer{min-height:55vh}.inspectDetails{padding:28px 22px}.hero h1{font-size:clamp(52px,14vw,84px)}}
        @media(max-width:560px){.vaultNav{padding:0 18px}.walletButton{padding:9px 12px;font-size:10px}.hero,.discover,.manifesto,.creatorBanner{padding-left:18px;padding-right:18px}.hero{min-height:auto;padding-top:38px}.heroViewer{height:360px}.heroStats{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gallery{grid-template-columns:1fr 1fr;gap:10px}.artInfo h3{font-size:12px}.artInfo>strong{font-size:9px}.artMeta>span:nth-child(2){display:none}.inspectBackdrop{padding:8px}.inspectModal{max-height:96vh;border-radius:18px}.inspectViewer{min-height:42vh}.payRow{grid-template-columns:1fr}.heroActions{flex-wrap:wrap}.heroActions a{flex:1;text-align:center}.sectionHead{display:block}.sectionHead p{margin-top:15px}.navLinks{display:none}}
      `}</style>
    </main>
  );
}

function PreviewArt({ item, hero = false }) {
  return <div className={`previewArt ${hero ? 'previewHero' : ''}`} aria-hidden="true"><div className="previewGrid"/><div className="previewGlow"/><div className="previewLabel">{item.family || item.shape || '3D'} · {item.material || item.style || 'digital form'}</div></div>;
}

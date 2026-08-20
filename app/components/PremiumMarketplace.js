'use client';

import { useMemo, useState } from 'react';
import VoxelViewer from './VoxelViewer';
import { buyAsset, makeOffer, bidOnAuction, mintAndList, hasContracts } from '../../lib/blockchain';

const ITEMS = [
  { id: 1, name: 'Midnight GT', creator: 'BlockGarage', shape: 'car', type: 'Vehicle', rarity: 'Epic', price: '0.110', blocks: '2,480', color: 'violet' },
  { id: 2, name: 'Modern Villa', creator: 'SpatialMint', shape: 'villa', type: 'Architecture', rarity: 'Legendary', price: '0.190', blocks: '4,920', color: 'blue' },
  { id: 3, name: 'Forest Owl', creator: 'PixelWild', shape: 'owl', type: 'Creature', rarity: 'Rare', price: '0.065', blocks: '1,180', color: 'green' },
  { id: 4, name: 'Marble Guardian', creator: 'WorldBlocks', shape: 'statue', type: 'Artifact', rarity: 'Legendary', price: '0.220', blocks: '3,640', color: 'gold' },
  { id: 5, name: 'Astra Robot 07', creator: 'FutureFoundry', shape: 'robot', type: 'Character', rarity: 'Rare', price: '0.090', blocks: '2,060', color: 'cyan' },
  { id: 6, name: 'Deep Space Hauler', creator: 'OrbitWorks', shape: 'ship', type: 'Vehicle', rarity: 'Epic', price: '0.160', blocks: '3,180', color: 'pink' },
  { id: 7, name: 'Red Fox Study', creator: 'VoxelWilds', shape: 'fox', type: 'Creature', rarity: 'Rare', price: '0.075', blocks: '1,420', color: 'orange' },
  { id: 8, name: 'Crystal Tree', creator: 'VoxelGarden', shape: 'tree', type: 'World', rarity: 'Rare', price: '0.055', blocks: '1,760', color: 'mint' },
];

const TABS = ['Discover', 'Collections', 'Offers', 'Auctions', 'Creators'];
const FILTERS = ['All', 'Vehicle', 'Architecture', 'Creature', 'Character', 'Artifact', 'World'];

export default function PremiumMarketplace() {
  const [tab, setTab] = useState('Discover');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Featured');
  const [query, setQuery] = useState('');
  const [wallet, setWallet] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState('');
  const [bid, setBid] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPrice, setCreatorPrice] = useState('0.10');
  const [creatorRoyalty, setCreatorRoyalty] = useState('5');
  const [creatorFile, setCreatorFile] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = ITEMS.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter;
      const matchesQuery = !q || `${item.name} ${item.creator} ${item.type} ${item.rarity}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    if (sort === 'Price: Low') result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'Price: High') result.sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [filter, query, sort]);

  async function connect() {
    try {
      if (!window.ethereum) throw new Error('MetaMask was not detected. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0] || '';
      setWallet(address);
      setStatus(address ? `Connected ${address.slice(0, 6)}…${address.slice(-4)}` : 'Wallet connection cancelled.');
    } catch (error) {
      setStatus(error?.message || 'Wallet connection failed.');
    }
  }

  async function transact(label, fn) {
    setBusy(true);
    setStatus(label);
    try {
      await fn();
      setStatus(`${label.replace('…', '')} complete. Confirmed by your wallet.`);
    } catch (error) {
      setStatus(error?.shortMessage || error?.reason || error?.message || 'Transaction failed.');
    } finally {
      setBusy(false);
    }
  }

  function buy() {
    if (!selected) return;
    transact(`Buying ${selected.name}…`, async () => {
      if (!hasContracts()) throw new Error('Live contracts are not configured yet. This is currently the collector preview.');
      await buyAsset(selected.id, selected.price);
    });
  }

  function sendOffer() {
    if (!selected) return;
    transact(`Submitting offer for ${selected.name}…`, async () => {
      if (!offer || Number(offer) <= 0) throw new Error('Enter a valid ETH offer.');
      if (!hasContracts()) throw new Error('Live marketplace contracts are not configured yet.');
      await makeOffer(selected.id, offer, 24);
    });
  }

  function sendBid() {
    if (!selected) return;
    transact(`Submitting bid for ${selected.name}…`, async () => {
      if (!bid || Number(bid) <= 0) throw new Error('Enter a valid ETH bid.');
      if (!hasContracts()) throw new Error('Live marketplace contracts are not configured yet.');
      await bidOnAuction(selected.id, bid);
    });
  }

  function publish() {
    transact('Preparing creator mint…', async () => {
      if (!creatorName.trim()) throw new Error('Give your asset a name.');
      if (!creatorFile) throw new Error('Choose a GLB or GLTF file.');
      if (!creatorPrice || Number(creatorPrice) <= 0) throw new Error('Enter a primary price.');
      if (!hasContracts()) throw new Error('Live contracts are not configured yet. Publishing UI is ready for the contract connection.');
      const metadata = { name: creatorName.trim(), description: 'Voxel Vault 3D asset', category: '3D voxel asset', fileName: creatorFile.name, royaltyPercent: Number(creatorRoyalty) };
      const uri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      await mintAndList({ uri, royaltyPercent: Number(creatorRoyalty), priceEth: creatorPrice });
    });
  }

  return (
    <section className="premiumMarket" id="marketplace">
      <div className="marketShell">
        <div className="marketTopline">
          <div className="marketKicker"><span /> THE VAULT MARKETPLACE <b>SEPOLIA</b></div>
          <button className="connectButton" onClick={connect}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect MetaMask'}</button>
        </div>

        <div className="marketHero">
          <div>
            <div className="marketKicker">DISCOVER · COLLECT · CREATE</div>
            <h2>Objects worth<br /><em>owning.</em></h2>
            <p>Voxel Vault is a 3D-first marketplace. Inspect the geometry, discover the creator, then collect the object when you're ready.</p>
          </div>
          <div className="heroObject"><VoxelViewer shape="owl" showcase interactive={false} label={false} /><div className="heroObjectMeta"><span>FEATURED DROP</span><strong>Forest Owl</strong><small>Rare · 1,180 blocks · 0.065 ETH</small></div></div>
        </div>

        <div className="marketNav">
          <div className="tabs">{TABS.map((name) => <button key={name} className={tab === name ? 'tab active' : 'tab'} onClick={() => setTab(name)}>{name}</button>)}</div>
          <div className="searchBox"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the vault" /></div>
        </div>

        {tab === 'Discover' && (
          <>
            <div className="filterRow"><div>{FILTERS.map((name) => <button key={name} className={filter === name ? 'filter active' : 'filter'} onClick={() => setFilter(name)}>{name}</button>)}</div><select value={sort} onChange={(e) => setSort(e.target.value)}><option>Featured</option><option>Price: Low</option><option>Price: High</option></select></div>
            <div className="marketGrid">{filtered.map((item, index) => <button key={item.id} className={`marketCard ${item.color}`} onClick={() => setSelected(item)}><div className="cardStage"><VoxelViewer shape={item.shape} compact label={false} interactive={false} showcase /><span className="rarityPill">{item.rarity}</span><span className="cardIndex">0{index + 1}</span></div><div className="cardInfo"><div><strong>{item.name}</strong><span>by {item.creator}</span></div><div className="cardPrice"><small>PRICE</small><b>{item.price} ETH</b></div></div><div className="cardFoot"><span>{item.type} · {item.blocks} blocks</span><i>View 3D ↗</i></div></button>)}</div>
            <div className="marketFeatures"><div><span>01 · CREATOR ECONOMY</span><strong>Publish your world.</strong><p>Bring a GLB/GLTF model, define its price and royalty, and prepare it for on-chain ownership.</p><button onClick={() => setTab('Creators')}>Open Creator Studio →</button></div><div><span>02 · SECONDARY MARKET</span><strong>Trade beyond the mint.</strong><p>Offers and auctions give collectors more ways to discover and transact.</p><button onClick={() => setTab('Offers')}>Explore market →</button></div><div><span>03 · DIGITAL OWNERSHIP</span><strong>Your wallet is your vault.</strong><p>Connect MetaMask when you want to sign a mint, purchase, offer or bid.</p><button onClick={connect}>Connect wallet →</button></div></div>
          </>
        )}

        {tab === 'Collections' && <div className="collectionsView"><div className="collectionsIntro"><span>CURATED WORLDS</span><h3>Built by creators,<br /><em>collected by you.</em></h3><p>Explore vehicles, creatures, architecture, characters and artifacts through the same interactive 3D lens.</p></div><div className="collectionBands"><div><strong>GENESIS</strong><span>8 showcase objects</span><b>01</b></div><div><strong>VOXEL WORLDS</strong><span>Architecture + environments</span><b>02</b></div><div><strong>CREATURE LAB</strong><span>Living voxel studies</span><b>03</b></div></div></div>}

        {tab === 'Offers' && <div className="actionPanel"><div className="actionCopy"><span>NEGOTIATE</span><h3>Make the object<br /><em>yours.</em></h3><p>Select any asset in Discover, then make a time-limited ETH offer directly from its collector view.</p><button onClick={() => setTab('Discover')}>Choose an asset →</button></div><div className="actionForm"><label>OFFER AMOUNT <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="0.080" inputMode="decimal" /></label><button disabled={!selected || busy} onClick={sendOffer}>{selected ? `Offer ${selected.name} →` : 'Select an asset first'}</button><small>{hasContracts() ? 'Marketplace contract detected.' : 'Collector preview. Live contract actions activate when contract addresses are configured.'}</small></div></div>}

        {tab === 'Auctions' && <div className="actionPanel"><div className="actionCopy"><span>LIVE BIDDING</span><h3>Compete for<br /><em>rare pieces.</em></h3><p>Choose an auction asset, inspect its 3D geometry and submit a wallet-signed ETH bid.</p><button onClick={() => setTab('Discover')}>Browse assets →</button></div><div className="actionForm"><label>BID AMOUNT <input value={bid} onChange={(e) => setBid(e.target.value)} placeholder="0.150" inputMode="decimal" /></label><button disabled={!selected || busy} onClick={sendBid}>{selected ? `Bid on ${selected.name} →` : 'Select an asset first'}</button><small>Auctions use the Voxel Vault marketplace contract when configured.</small></div></div>}

        {tab === 'Creators' && <div className="creatorStudio"><div className="creatorCopy"><span>CREATOR STUDIO</span><h3>Make the model.<br /><em>Keep the upside.</em></h3><p>Stage your real 3D file, set a primary price and creator royalty, then sign the mint when the contract layer is ready.</p><div className="studioSteps"><span><b>01</b> Model</span><span><b>02</b> Metadata</span><span><b>03</b> Royalty</span><span><b>04</b> Mint</span></div></div><div className="studioForm"><input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Asset name" /><input value={creatorPrice} onChange={(e) => setCreatorPrice(e.target.value)} placeholder="Primary price · ETH" inputMode="decimal" /><label className="fileDrop">{creatorFile ? `✓ ${creatorFile.name}` : 'Drop a GLB / GLTF or choose a file'}<input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(e) => setCreatorFile(e.target.files?.[0] || null)} /></label><div className="royalty"><span>ROYALTY</span><input type="range" min="0" max="10" step="0.5" value={creatorRoyalty} onChange={(e) => setCreatorRoyalty(e.target.value)} /><b>{creatorRoyalty}%</b></div><button disabled={busy} onClick={publish}>{busy ? 'Waiting for wallet…' : 'Prepare mint + listing →'}</button></div></div>}

        {status && <div className="marketStatus"><span>●</span>{status}</div>}
      </div>

      {selected && <div className="collectorOverlay" role="dialog" aria-modal="true"><div className="collectorModal"><button className="modalClose" onClick={() => setSelected(null)}>×</button><div className="collectorViewer"><VoxelViewer shape={selected.shape} label={false} interactive showcase={false} /></div><div className="collectorInfo"><div className="collectorLabel"><span>{selected.rarity}</span><span>{selected.type}</span><span>{selected.blocks} BLOCKS</span></div><h3>{selected.name}</h3><p>Created by <b>{selected.creator}</b>. Inspect the geometry in real time, then choose how you want to collect it.</p><div className="collectorPrice"><span>LISTED FOR</span><strong>{selected.price} ETH</strong><small>Ethereum Sepolia · wallet-ready</small></div><div className="collectorActions"><button onClick={buy} disabled={busy}>Collect now</button><button onClick={sendOffer} disabled={busy}>Make offer</button><button onClick={() => { setTab('Auctions'); setSelected(null); }}>Auction</button></div><div className="collectorDNA"><span>VERIFIABLE DNA</span><b>Geometry · Rarity · Creator · Edition</b></div></div></div></div>}

      <style jsx>{`
        .premiumMarket{padding:18px 5vw 120px;background:#05060a;color:#f7f8ff}.marketShell{max-width:1320px;margin:auto;border:1px solid #25283a;border-radius:28px;background:radial-gradient(circle at 85% 10%,rgba(125,91,255,.12),transparent 28%),linear-gradient(145deg,#090b12,#0d0d16);overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.28)}
        .marketTopline{padding:22px 28px;border-bottom:1px solid #1b1e2c;display:flex;justify-content:space-between;align-items:center}.marketKicker{font-size:9px;letter-spacing:2.2px;color:#8177a8;font-weight:900}.marketKicker span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#9678ff;box-shadow:0 0 14px #9678ff;margin-right:9px}.marketKicker b{color:#61d7ad;margin-left:10px}.connectButton{border:1px solid #3a3158;background:#12121d;color:#fff;border-radius:10px;padding:10px 14px;font-size:10px;font-weight:900;cursor:pointer}.connectButton:hover{border-color:#9071ff;background:#18132a}
        .marketHero{min-height:510px;padding:55px 45px;display:grid;grid-template-columns:.8fr 1.2fr;gap:35px;align-items:center;border-bottom:1px solid #1b1e2c}.marketHero h2{font-size:clamp(48px,6vw,86px);line-height:.88;letter-spacing:-5px;margin:18px 0}.marketHero em,.collectionsIntro em,.actionCopy em,.creatorCopy em{font-style:normal;color:#9677ff}.marketHero p{max-width:470px;color:#8b92a4;line-height:1.7;font-size:13px}.heroObject{height:390px;border:1px solid #292d40;border-radius:20px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(118,82,255,.2),transparent 58%),#070910}.heroObject .voxelViewer{height:100%}.heroObjectMeta{position:absolute;left:18px;bottom:18px;display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid #30354a;border-radius:10px;background:rgba(6,7,12,.78);backdrop-filter:blur(14px)}.heroObjectMeta span{font-size:7px;color:#9b82ff;letter-spacing:2px}.heroObjectMeta strong{font-size:16px}.heroObjectMeta small{font-size:8px;color:#858c9e}
        .marketNav{padding:18px 28px;display:flex;gap:15px;align-items:center;border-bottom:1px solid #1b1e2c}.tabs{display:flex;gap:3px;flex-wrap:wrap}.tab{border:0;background:transparent;color:#71788b;padding:10px 12px;border-radius:8px;font-size:10px;font-weight:850;cursor:pointer}.tab.active{background:#1a1530;color:#fff}.searchBox{margin-left:auto;display:flex;align-items:center;gap:8px;border:1px solid #292d3c;background:#080a10;border-radius:9px;padding:0 11px;min-width:220px}.searchBox span{color:#737a8c}.searchBox input{border:0;outline:0;background:transparent;color:#fff;padding:10px 0;width:100%;font-size:10px}
        .filterRow{padding:24px 28px 18px;display:flex;justify-content:space-between;gap:12px;align-items:center}.filterRow>div{display:flex;gap:6px;flex-wrap:wrap}.filter{border:1px solid #252a39;background:#0a0c13;color:#737b8e;padding:7px 11px;border-radius:999px;font-size:9px;cursor:pointer}.filter.active{color:#fff;border-color:#7054dc;background:#19142e}.filterRow select{background:#0a0c13;color:#aaa;border:1px solid #282d3b;border-radius:8px;padding:8px;font-size:9px}
        .marketGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 28px 28px}.marketCard{border:1px solid #202433;background:#0a0c12;color:#fff;border-radius:14px;overflow:hidden;text-align:left;padding:0;cursor:pointer;transition:transform .22s,border-color .22s,box-shadow .22s}.marketCard:hover{transform:translateY(-5px);border-color:#4b3b76;box-shadow:0 25px 60px rgba(0,0,0,.35)}.cardStage{height:245px;position:relative;background:radial-gradient(circle at 50% 48%,rgba(122,88,255,.12),transparent 62%),#080a10}.cardStage .voxelViewer{height:100%;min-height:0}.rarityPill,.cardIndex{position:absolute;top:11px;border:1px solid #303448;background:rgba(5,6,10,.68);padding:6px 8px;border-radius:6px;font-size:7px;letter-spacing:1px;z-index:3}.rarityPill{left:11px}.cardIndex{right:11px;color:#6d7384}.cardInfo{padding:14px;display:flex;justify-content:space-between;gap:8px}.cardInfo>div:first-child{display:flex;flex-direction:column;gap:5px}.cardInfo strong{font-size:14px}.cardInfo span,.cardFoot{font-size:8px;color:#72798b}.cardPrice{text-align:right;display:flex;flex-direction:column;gap:5px}.cardPrice small{font-size:6px;color:#62697a;letter-spacing:1px}.cardPrice b{font-size:11px}.cardFoot{border-top:1px solid #1b1e2a;padding:10px 14px;display:flex;justify-content:space-between}.cardFoot i{color:#9a7dff;font-style:normal;font-weight:800}
        .marketFeatures{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border-top:1px solid #1b1e2c;background:#1b1e2c}.marketFeatures>div{background:#0b0d13;padding:25px 28px;min-height:180px}.marketFeatures span,.creatorCopy>span,.actionCopy>span,.collectionsIntro>span{font-size:7px;letter-spacing:2px;color:#8276ae}.marketFeatures strong{display:block;font-size:17px;margin:10px 0}.marketFeatures p{font-size:10px;color:#777f91;line-height:1.6;min-height:34px}.marketFeatures button,.actionCopy button,.studioForm button{border:1px solid #38304e;background:#14111f;color:#fff;border-radius:8px;padding:9px 11px;font-size:9px;font-weight:850;cursor:pointer}.marketFeatures button:hover,.actionCopy button:hover,.studioForm button:hover{background:#8a68ff;border-color:#8a68ff}
        .collectionsView,.actionPanel,.creatorStudio{margin:28px;padding:45px;border:1px solid #25293a;border-radius:18px;background:#0a0c12}.collectionsIntro h3,.actionCopy h3,.creatorCopy h3{font-size:45px;letter-spacing:-2px;line-height:.95;margin:13px 0}.collectionsIntro p,.actionCopy p,.creatorCopy p{max-width:500px;color:#7f8798;font-size:11px;line-height:1.7}.collectionBands{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:35px}.collectionBands div{min-height:140px;border:1px solid #24293a;border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(145deg,#0e1018,#0a0c12)}.collectionBands strong{font-size:12px}.collectionBands span{color:#777f91;font-size:9px}.collectionBands b{color:#765ce1;font-size:10px}
        .actionPanel{display:grid;grid-template-columns:1.2fr .8fr;gap:45px;align-items:center}.actionForm{display:flex;flex-direction:column;gap:12px;border:1px solid #282d3d;border-radius:13px;padding:20px;background:#080a10}.actionForm label{display:flex;flex-direction:column;gap:7px;color:#6e7587;font-size:7px;letter-spacing:1.5px}.actionForm input,.studioForm input{background:#0c0e15;border:1px solid #2b3040;color:#fff;border-radius:8px;padding:12px;outline:0}.actionForm>button{border:0;background:#8967ff;color:#fff;border-radius:8px;padding:12px;font-weight:900;cursor:pointer}.actionForm small{color:#666e80;font-size:8px;line-height:1.5}
        .creatorStudio{display:grid;grid-template-columns:1fr 1fr;gap:55px}.studioSteps{display:flex;flex-direction:column;gap:9px;margin-top:25px}.studioSteps span{font-size:10px;color:#838a9b}.studioSteps b{display:inline-grid;place-items:center;width:24px;height:24px;border:1px solid #39304f;border-radius:7px;color:#9879ff;margin-right:8px}.studioForm{display:flex;flex-direction:column;gap:10px;padding:22px;border:1px solid #282d3d;border-radius:14px;background:#080a10}.fileDrop{border:1px dashed #3b4051;border-radius:9px;padding:22px;text-align:center;color:#81899a;font-size:9px;cursor:pointer}.fileDrop input{display:none}.royalty{display:flex;align-items:center;gap:10px;border:1px solid #242938;border-radius:9px;padding:10px}.royalty span{font-size:7px;color:#707789;letter-spacing:1px}.royalty input{flex:1}.royalty b{font-size:11px;color:#a88dff}.studioForm button{background:#8967ff;border-color:#8967ff;padding:12px}
        .marketStatus{margin:0 28px 28px;padding:11px 13px;border:1px solid #282d3d;background:#080a10;border-radius:9px;color:#9da4b5;font-size:9px}.marketStatus span{color:#69d5ac;margin-right:7px}
        .collectorOverlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(12px);z-index:100;display:grid;place-items:center;padding:18px}.collectorModal{width:min(1050px,96vw);max-height:92vh;overflow:auto;display:grid;grid-template-columns:1.15fr .85fr;border:1px solid #35304d;border-radius:20px;background:#0b0d14;box-shadow:0 40px 120px rgba(0,0,0,.65);position:relative}.modalClose{position:absolute;right:14px;top:14px;z-index:4;width:32px;height:32px;border:1px solid #34394b;border-radius:50%;background:#0a0c12;color:#fff;font-size:19px;cursor:pointer}.collectorViewer{min-height:580px;background:radial-gradient(circle at 50% 45%,rgba(117,82,255,.2),transparent 60%),#070910}.collectorViewer .voxelViewer{height:580px}.collectorInfo{padding:48px 36px;display:flex;flex-direction:column;justify-content:center}.collectorLabel{display:flex;gap:7px;flex-wrap:wrap}.collectorLabel span{border:1px solid #303548;border-radius:999px;padding:6px 8px;color:#8b92a3;font-size:7px;letter-spacing:1px}.collectorInfo h3{font-size:42px;letter-spacing:-2px;margin:17px 0 8px}.collectorInfo p{color:#7e8698;font-size:10px;line-height:1.7}.collectorPrice{border-block:1px solid #242838;padding:18px 0;margin:20px 0;display:flex;flex-direction:column;gap:4px}.collectorPrice span{font-size:7px;color:#6f7688;letter-spacing:1.5px}.collectorPrice strong{font-size:25px}.collectorPrice small{color:#777f91;font-size:8px}.collectorActions{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:7px}.collectorActions button{border:1px solid #34394b;background:#11131b;color:#fff;border-radius:8px;padding:11px;font-size:9px;font-weight:850;cursor:pointer}.collectorActions button:first-child{background:#8967ff;border-color:#8967ff}.collectorDNA{margin-top:20px;border:1px solid #282d3d;border-radius:9px;padding:12px;display:flex;flex-direction:column;gap:5px}.collectorDNA span{font-size:7px;color:#8d77d7;letter-spacing:1.5px}.collectorDNA b{font-size:9px;color:#9da4b4}
        @media(max-width:950px){.marketHero,.creatorStudio,.actionPanel,.collectorModal{grid-template-columns:1fr}.marketHero{padding:35px 25px}.marketGrid{grid-template-columns:repeat(2,1fr)}.marketFeatures,.collectionBands{grid-template-columns:1fr}.searchBox{min-width:150px}.collectorViewer,.collectorViewer .voxelViewer{height:430px;min-height:430px}.collectorInfo{padding:28px}.marketNav{align-items:flex-start;flex-direction:column}.searchBox{margin-left:0;width:100%}}
        @media(max-width:560px){.marketTopline{padding:17px}.marketHero h2{font-size:52px;letter-spacing:-3px}.marketHero p{font-size:11px}.marketGrid{grid-template-columns:1fr;padding:0 14px 14px}.filterRow,.marketNav{padding-left:17px;padding-right:17px}.marketFeatures{display:block}.marketFeatures>div{border-bottom:1px solid #1b1e2c}.collectionsView,.actionPanel,.creatorStudio{margin:14px;padding:22px}.collectionsIntro h3,.actionCopy h3,.creatorCopy h3{font-size:35px}.collectorActions{grid-template-columns:1fr}.collectorInfo h3{font-size:34px}}
      `}</style>
    </section>
  );
}

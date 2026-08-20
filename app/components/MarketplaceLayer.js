'use client';
import { useMemo, useState } from 'react';
import VoxelViewer from './VoxelViewer';
import { buyAsset, makeOffer, bidOnAuction, mintAndList, hasContracts } from '../../lib/blockchain';

const tabs = ['Collections','Publish','Offers','Auctions','Royalties','My Assets'];
const assets = [
  {id:1,name:'Midnight GT',shape:'car',type:'Vehicle',rarity:'Epic',price:'0.110'},
  {id:2,name:'Modern Villa',shape:'villa',type:'Architecture',rarity:'Legendary',price:'0.190'},
  {id:3,name:'Forest Owl',shape:'owl',type:'Creature',rarity:'Rare',price:'0.065'},
  {id:4,name:'Marble Guardian',shape:'statue',type:'Artifact',rarity:'Legendary',price:'0.220'},
  {id:5,name:'Astra Robot 07',shape:'robot',type:'Character',rarity:'Rare',price:'0.090'},
  {id:6,name:'Deep Space Hauler',shape:'ship',type:'Vehicle',rarity:'Epic',price:'0.160'}
];

export default function MarketplaceLayer() {
  const [tab,setTab] = useState('Collections');
  const [wallet,setWallet] = useState('');
  const [status,setStatus] = useState('');
  const [search,setSearch] = useState('');
  const [sort,setSort] = useState('Featured');
  const [royalty,setRoyalty] = useState(5);
  const [title,setTitle] = useState('');
  const [price,setPrice] = useState('0.10');
  const [file,setFile] = useState(null);
  const [selected,setSelected] = useState(null);
  const [offer,setOffer] = useState('');
  const [auctionBid,setAuctionBid] = useState('');
  const [busy,setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = assets.filter(x => x.name.toLowerCase().includes(q) || x.type.toLowerCase().includes(q) || x.rarity.toLowerCase().includes(q));
    if (sort === 'Price: Low') list.sort((a,b) => Number(a.price)-Number(b.price));
    if (sort === 'Price: High') list.sort((a,b) => Number(b.price)-Number(a.price));
    return list;
  }, [search,sort]);

  const connect = async () => {
    try {
      if (!window.ethereum) { setStatus('MetaMask is not installed. On iPhone, open Voxel Vault from MetaMask Mobile.'); return; }
      const accounts = await window.ethereum.request({method:'eth_requestAccounts'});
      setWallet(accounts?.[0] || '');
      setStatus(accounts?.[0] ? 'Wallet connected. Ethereum Sepolia is used for testing.' : 'Connection cancelled.');
    } catch (e) { setStatus(e?.message || 'Wallet connection failed.'); }
  };

  const run = async (label, fn) => {
    setBusy(true); setStatus(label);
    try { await fn(); setStatus(`${label} Complete. Check MetaMask and the transaction receipt.`); }
    catch (e) { setStatus(e?.shortMessage || e?.reason || e?.message || 'Transaction failed.'); }
    finally { setBusy(false); }
  };

  const buy = () => selected && run(`Buying ${selected.name}…`, async () => {
    if (!hasContracts()) throw new Error('Marketplace contracts are not configured yet.');
    await buyAsset(selected.id, selected.price);
  });
  const makeOfferAction = () => selected && run(`Submitting ${offer} ETH offer…`, async () => {
    if (!offer || Number(offer) <= 0) throw new Error('Enter an offer amount.');
    await makeOffer(selected.id, offer, 24);
  });
  const bidAction = () => selected && run(`Submitting ${auctionBid} ETH bid…`, async () => {
    if (!auctionBid || Number(auctionBid) <= 0) throw new Error('Enter a bid amount.');
    await bidOnAuction(selected.id, auctionBid);
  });
  const publish = () => run('Preparing mint…', async () => {
    if (!title) throw new Error('Add an asset name first.');
    if (!file) throw new Error('Choose the GLB/GLTF file first.');
    if (!price || Number(price) <= 0) throw new Error('Enter a price.');
    if (!hasContracts()) throw new Error('Ethereum Sepolia contracts are not configured in Vercel yet.');
    const metadata = {name:title, description:'Voxel Vault 3D asset', category:'3D voxel asset', fileName:file.name, royaltyPercent:royalty};
    const uri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    await mintAndList({uri, royaltyPercent:royalty, priceEth:price});
  });

  return (
    <section className="marketplaceLayer" id="marketplace">
      <div className="marketplaceInner">
        <div className="marketplaceHead">
          <div><div className="marketEyebrow">THE MARKETPLACE ENGINE · ETHEREUM SEPOLIA</div><h2>From <em>asset</em> to ownership.</h2><p>Explore real-time 3D voxel objects, open a full viewer, connect your wallet and use the contract-backed marketplace when contracts are configured.</p></div>
          <button className="marketWallet" onClick={connect}>{wallet ? `${wallet.slice(0,6)}…${wallet.slice(-4)}` : '◈ Connect MetaMask'}</button>
        </div>
        <div className="marketToolbar"><input aria-label="Search marketplace" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets, collections or rarity…"/><select value={sort} onChange={e=>setSort(e.target.value)}><option>Featured</option><option>Price: Low</option><option>Price: High</option></select></div>
        <div className="marketTabs">{tabs.map(t=><button key={t} className={tab===t?'marketTab active':'marketTab'} onClick={()=>setTab(t)}>{t}</button>)}</div>

        {tab === 'Collections' && <>
          <div className="marketGrid">{filtered.map(x=><button key={x.id} className="assetTile" onClick={()=>setSelected(x)}><div className="miniViewer"><VoxelViewer shape={x.shape} compact label={false} interactive={false} showcase/></div><span>{x.rarity.toUpperCase()} · 3D</span><strong>{x.name}</strong><p>{x.type} · {x.price} ETH</p><i>Open 3D object ↗</i></button>)}</div>
          <div className="marketGrid secondaryGrid"><div><span>CREATOR DROPS</span><strong>Build collections</strong><p>Publish voxel models with metadata, royalties and an Ethereum ownership trail.</p><button onClick={()=>setTab('Publish')}>Publish a collection →</button></div><div><span>OWNERSHIP</span><strong>Wallet-native</strong><p>Connect before signing a mint, purchase, offer or transfer.</p><button onClick={connect}>Connect wallet →</button></div><div><span>SECONDARY MARKET</span><strong>Offers + auctions</strong><p>Use signed Ethereum transactions for offers, bids and settlement.</p><button onClick={()=>setTab('Offers')}>Open market →</button></div></div>
        </>}

        {tab === 'Publish' && <div className="publishPanel"><div><span>CREATOR PUBLISHING</span><strong>Mint a real 3D asset</strong><p>Upload your GLB/GLTF, enter metadata and sign the Ethereum Sepolia mint + listing transaction.</p><div className="publishFields"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Asset name"/><input value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal" placeholder="Primary price in ETH"/><input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={e=>setFile(e.target.files?.[0]||null)}/></div><div className="publishMeta"><span>{file?`✓ ${file.name}`:'Select a GLB/GLTF file'}</span><span>Royalty: {royalty}%</span><span>Ethereum Sepolia</span></div><button disabled={busy} onClick={publish}>{busy?'Waiting for MetaMask…':'Mint + list on Ethereum →'}</button></div><div className="publishChecklist"><b>01</b><span>3D file</span><b>02</b><span>Metadata</span><b>03</b><span>Royalty</span><b>04</b><span>Wallet signature</span><b>05</b><span>Mint + listing</span></div></div>}

        {tab === 'Offers' && <div className="marketGrid"><div><span>OFFERS</span><strong>Make an offer</strong><p>Open an asset first, enter an amount and sign a 24-hour ETH offer.</p><input className="actionInput" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Offer in ETH"/><button disabled={!selected||busy} onClick={makeOfferAction}>{selected?'Submit offer →':'Open a 3D asset first'}</button></div><div><span>FIXED PRICE</span><strong>Buy now</strong><p>Open an asset to inspect the 3D model, then sign the listed price.</p><button onClick={()=>setTab('Collections')}>Choose an asset →</button></div><div><span>OWNER</span><strong>My assets</strong><p>Wallet ownership and inventory are tied to the NFT contract.</p><button onClick={()=>setTab('My Assets')}>My assets →</button></div></div>}

        {tab === 'Auctions' && <div className="marketGrid"><div><span>LIVE BIDDING</span><strong>Place a bid</strong><p>Select an auction asset and submit an ETH bid.</p><input className="actionInput" value={auctionBid} onChange={e=>setAuctionBid(e.target.value)} placeholder="Bid in ETH"/><button disabled={!selected||busy} onClick={bidAction}>{selected?'Place bid →':'Choose an asset first'}</button></div><div><span>TRANSPARENCY</span><strong>On-chain state</strong><p>Listings, offers and auctions use marketplace contract state.</p><button onClick={()=>setTab('Collections')}>Inspect 3D assets →</button></div><div><span>SETTLEMENT</span><strong>Wallet signed</strong><p>Winning bids settle through the contract after the auction ends.</p></div></div>}

        {tab === 'Royalties' && <div className="royaltyPanel"><span>CREATOR ECONOMY</span><strong>Keep the creator in the loop.</strong><p>Set the royalty percentage used during mint staging.</p><div className="royaltyBar"><label>Creator royalty</label><input type="range" min="0" max="10" step="0.5" value={royalty} onChange={e=>setRoyalty(Number(e.target.value))}/><b>{royalty}%</b></div></div>}

        {tab === 'My Assets' && <div className="marketGrid"><div><span>OWNED</span><strong>{wallet?'Wallet connected':'Connect to view inventory'}</strong><p>Connect MetaMask to identify the wallet that owns your NFTs.</p><button onClick={connect}>Sync wallet →</button></div><div><span>WITHDRAWALS</span><strong>Marketplace proceeds</strong><p>Contract proceeds and refunds are held in pending withdrawals.</p></div><div><span>CREATOR</span><strong>Publish another</strong><p>Return to the creator pipeline and mint another model.</p><button onClick={()=>setTab('Publish')}>Create asset →</button></div></div>}
        {status && <div className="marketStatus">● {status}</div>}
      </div>

      {selected && <div className="assetModal" role="dialog" aria-modal="true"><div className="assetModalCard"><button className="closeModal" onClick={()=>setSelected(null)}>×</button><div className="modalViewer"><VoxelViewer shape={selected.shape} label interactive showcase={false}/></div><div className="modalInfo"><span>{selected.rarity.toUpperCase()} · {selected.type.toUpperCase()}</span><h3>{selected.name}</h3><p>Interactive Voxel Vault 3D object. Drag to rotate and inspect the model.</p><div className="priceLine"><strong>{selected.price} ETH</strong><small>Ethereum Sepolia test asset</small></div><div className="modalActions"><button disabled={busy} onClick={buy}>Buy now</button><button disabled={busy} onClick={makeOfferAction}>Offer</button><button onClick={()=>{setSelected(null);setTab('Auctions')}}>Auction</button></div><input className="actionInput" value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Offer amount in ETH"/><small className="contractNote">{hasContracts()?'Contract addresses detected.':'Demo viewer active. Add NEXT_PUBLIC_VOXEL_NFT_ADDRESS and NEXT_PUBLIC_VOXEL_MARKET_ADDRESS to enable transactions.'}</small></div></div></div>}

      <style jsx>{`
        .marketplaceLayer{padding:20px 5vw 110px;background:#05060a}.marketplaceInner{max-width:1320px;margin:auto;border:1px solid #27233b;border-radius:24px;background:linear-gradient(145deg,#0b0d14,#100e1c);padding:42px}.marketplaceHead{display:flex;justify-content:space-between;gap:30px;align-items:end}.marketEyebrow{font-size:9px;letter-spacing:2.5px;color:#8970ff;font-weight:900}.marketplaceHead h2{font-size:46px;letter-spacing:-2px;margin:10px 0;color:#fff}.marketplaceHead h2 em{font-style:normal;color:#987bff}.marketplaceHead p,.marketGrid p,.publishPanel p,.royaltyPanel p,.modalInfo p{color:#858c9e;line-height:1.65;font-size:11px}.marketWallet,.marketGrid button,.publishPanel button,.modalActions button{border:1px solid #393251;background:#11121b;color:#fff;border-radius:10px;padding:12px 15px;font-weight:800;cursor:pointer}.marketToolbar{display:flex;gap:8px;margin-top:28px}.marketToolbar input,.marketToolbar select,.publishFields input,.actionInput{background:#07080d;border:1px solid #2b3040;color:#fff;border-radius:9px;padding:12px}.marketToolbar input{flex:1}.marketTabs{display:flex;gap:7px;flex-wrap:wrap;margin:20px 0 18px;border-bottom:1px solid #222536;padding-bottom:12px}.marketTab{border:0!important;background:transparent!important;color:#6f7689!important;padding:10px 12px!important}.marketTab.active{background:#1b1533!important;color:#fff!important}.marketGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.secondaryGrid{margin-top:12px}.marketGrid>div{border:1px solid #25293a;background:#0a0c13;border-radius:15px;padding:24px}.marketGrid span,.publishPanel span,.royaltyPanel span,.modalInfo>span{display:block;color:#8173b6;font-size:8px;letter-spacing:2px;margin-bottom:10px}.marketGrid strong,.publishPanel strong,.royaltyPanel strong{display:block;font-size:20px;color:#fff}.assetTile{padding:0!important;text-align:left;overflow:hidden;background:#0a0c13!important}.assetTile .miniViewer{height:210px;pointer-events:none}.assetTile>span,.assetTile>strong,.assetTile>p,.assetTile>i{margin-left:18px;margin-right:18px}.assetTile>strong{font-size:21px}.assetTile>i{display:block;color:#a58fff;font-size:9px;font-style:normal;margin-bottom:18px}.publishPanel,.royaltyPanel{border:1px solid #25293a;background:#0a0c13;border-radius:15px;padding:24px}.publishFields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:20px 0 10px}.publishFields input[type=file]{grid-column:1/-1}.publishMeta{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px}.publishMeta span{border:1px solid #292d3e;background:#0d0f17;padding:7px 9px;border-radius:999px;color:#9097a9;margin:0}.publishChecklist{display:none}.royaltyBar{display:flex;gap:15px;align-items:center;margin-top:20px}.marketStatus{margin-top:16px;border:1px solid #292d3e;padding:12px;border-radius:10px;color:#aaa}.assetModal{position:fixed;inset:0;background:rgba(0,0,0,.78);display:grid;place-items:center;z-index:50;padding:20px}.assetModalCard{max-width:1000px;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:20px;background:#0b0d14;border:1px solid #393251;border-radius:20px;padding:20px;position:relative}.modalViewer{min-height:420px}.closeModal{position:absolute;right:12px;top:10px;background:none;border:0;color:#fff;font-size:28px;cursor:pointer}.modalActions{display:flex;gap:8px;margin:18px 0}.contractNote{display:block;color:#777f92;margin-top:12px}@media(max-width:800px){.marketplaceInner{padding:22px}.marketplaceHead,.assetModalCard{grid-template-columns:1fr;display:grid}.marketplaceHead h2{font-size:34px}.marketGrid{grid-template-columns:1fr}.publishFields{grid-template-columns:1fr}.publishFields input[type=file]{grid-column:auto}}
      `}</style>
    </section>
  );
}

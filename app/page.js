'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import PremiumGLBViewer from './components/PremiumGLBViewer';

export default function Home(){
  const [email,setEmail]=useState('');
  const [user,setUser]=useState(null);
  const [assets,setAssets]=useState([]);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState('All');
  const [wallet,setWallet]=useState('');

  useEffect(()=>{
    if(!supabaseBrowser){setMessage('Marketplace data is not configured yet.');return;}
    let mounted=true;
    supabaseBrowser.auth.getUser().then(({data})=>{if(mounted)setUser(data.user??null)});
    const {data:listener}=supabaseBrowser.auth.onAuthStateChange((_e,s)=>{if(mounted)setUser(s?.user??null)});
    supabaseBrowser.from('assets').select('*').eq('status','published').order('created_at',{ascending:false}).then(({data,error})=>{
      if(!mounted)return;
      if(error){setMessage(error.message);return}
      setAssets(data??[]);
    });
    return()=>{mounted=false;listener?.subscription?.unsubscribe()};
  },[]);

  async function connectWallet(){
    try{
      if(!window.ethereum){setMessage('MetaMask was not detected. Open Voxel Vault inside MetaMask Mobile or install MetaMask.');return}
      setLoading(true);
      const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
      const address=accounts?.[0]||'';
      setWallet(address);
      setMessage(address?`Wallet connected: ${address.slice(0,6)}…${address.slice(-4)}`:'Wallet connection cancelled.');
    }catch(e){setMessage(e?.message||'Wallet connection failed.')}finally{setLoading(false)}
  }

  const live=useMemo(()=>assets.map((a,i)=>({
    ...a,
    creator:a.creator_name||a.creator||a.author||'VoxelVault Creator',
    price:Number(a.price_eth??a.price??((a.price_cents||0)/100))||0,
    rarity:a.rarity||a.tier||['Common','Uncommon','Rare','Epic','Legendary'][i%5],
    type:a.type||a.category||'3D NFT',
    note:a.note||a.description||'Premium 3D voxel asset',
    modelUrl:a.model_url||a.glb_url||a.gltf_url||a.asset_url||a.animation_url||''
  })),[assets]);
  const filtered=useMemo(()=>filter==='All'?live:live.filter(a=>a.rarity===filter||a.type===filter),[live,filter]);
  const featured=filtered[0]||live[0]||null;
  const cards=(featured?filtered.slice(1):filtered).slice(0,6);

  return <main className="vaultPage">
    <nav className="nav"><div className="brand"><span className="brandMark">V</span><span>VOXEL<span className="accent">VAULT</span></span></div><div className="navLinks"><a href="#explore">Explore</a><a href="#collections">Collections</a><a href="#creators">Creators</a><a href="#create">Create</a></div><button className="walletBtn" onClick={connectWallet} disabled={loading}>{wallet?`${wallet.slice(0,6)}…${wallet.slice(-4)}`:'Connect MetaMask'}</button></nav>
    {message&&<div className="vaultMessage">{message}</div>}
    <section className="hero" id="explore"><div className="heroCopy"><div className="eyebrow">PREMIUM 3D VOXEL NFTs</div><h1>The Vault for <span>Living Worlds.</span></h1><p>Discover detailed voxel creations built as real 3D assets, with rarity-driven geometry and verifiable DNA.</p></div>{featured?.modelUrl?<PremiumGLBViewer assetUrl={featured.modelUrl}/>:<div className="emptyViewer"><strong>No published 3D assets yet</strong><span>Publish a GLB-backed asset to Supabase and it will appear here automatically.</span></div>}</section>
    <section id="collections" className="collectionSection"><div className="sectionHead"><div><div className="eyebrow">THE COLLECTION</div><h2>Explore the Vault</h2></div><div className="filters">{['All','Common','Uncommon','Rare','Epic','Legendary'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div></div><div className="vaultGrid">{cards.map(asset=><article className="nftCard" key={asset.id||asset.token_id||asset.modelUrl}><div className="nftPreview">{asset.modelUrl?<PremiumGLBViewer assetUrl={asset.modelUrl} compact/>:<div className="emptyViewer small">3D asset pending</div>}</div><div className="nftInfo"><div><h3>{asset.name||`Voxel Vault #${asset.token_id||''}`}</h3><span>{asset.rarity}</span></div><p>{asset.note}</p><strong>{asset.price?`${asset.price} ETH`:'Unpriced'}</strong></div></article>)}</div>{!cards.length&&<div className="emptyCatalog">No published 3D NFTs match this filter.</div>}</section>
    <section id="creators" className="creatorSection"><div className="eyebrow">BUILT FOR CREATORS</div><h2>Real models. Real ownership.</h2><p>Voxel Vault now consumes the actual GLB asset attached to each published NFT instead of substituting the old procedural demo shapes.</p></section>
  </main>
}

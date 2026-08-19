'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

const demoNFTs = [
  { id:'demo-castle', title:'Neon Castle', creator:'VoxelForge', price:.18, rarity:'Legendary', type:'World', style:'game', color:'violet' },
  { id:'demo-dragon', title:'Cyber Dragon', creator:'MetaBeast', price:.14, rarity:'Epic', type:'Character', style:'game', color:'cyan' },
  { id:'demo-car', title:'Midnight GT', creator:'BlockGarage', price:.11, rarity:'Epic', type:'Vehicle', style:'realistic', color:'blue' },
  { id:'demo-owl', title:'Forest Owl', creator:'PixelWild', price:.065, rarity:'Rare', type:'Creature', style:'realistic', color:'green' },
  { id:'demo-robot', title:'Astra Unit 07', creator:'FutureFoundry', price:.09, rarity:'Rare', type:'Character', style:'game', color:'orange' },
  { id:'demo-house', title:'Voxel Modern House', creator:'SpatialMint', price:.125, rarity:'Epic', type:'Architecture', style:'realistic', color:'pink' },
  { id:'demo-statue', title:'Marble Guardian', creator:'WorldBlocks', price:.22, rarity:'Legendary', type:'Artifact', style:'realistic', color:'gold' },
  { id:'demo-portal', title:'Aether Portal', creator:'NovaLabs', price:.21, rarity:'Legendary', type:'World', style:'fantasy', color:'violet' },
  { id:'demo-ship', title:'Deep Space Hauler', creator:'OrbitWorks', price:.16, rarity:'Epic', type:'Vehicle', style:'game', color:'cyan' },
  { id:'demo-tree', title:'Ancient Crystal Tree', creator:'VoxelGarden', price:.075, rarity:'Rare', type:'Creature', style:'fantasy', color:'green' },
  { id:'demo-sneaker', title:'Hyper Runner', creator:'StreetVoxel', price:.055, rarity:'Rare', type:'Artifact', style:'realistic', color:'pink' },
  { id:'demo-temple', title:'Sun Temple', creator:'AncientBlocks', price:.195, rarity:'Legendary', type:'Architecture', style:'fantasy', color:'gold' },
];

function VoxelModel({ style='game', color='violet', compact=false }) {
  const blocks = Array.from({ length: compact ? 18 : 42 }, (_, i) => i);
  return (
    <div className={`voxelScene ${compact ? 'compact' : ''}`} aria-hidden="true">
      <div className={`voxelModel ${style} ${color}`}>
        {blocks.map(i => <i key={i} style={{ '--i': i }} />)}
      </div>
      <div className="voxelShadow" />
    </div>
  );
}

export default function Home() {
  const [email,setEmail]=useState('');
  const [user,setUser]=useState(null);
  const [assets,setAssets]=useState([]);
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState('All');

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({data}) => setUser(data.user ?? null));
    const {data:listener}=supabaseBrowser.auth.onAuthStateChange((_event,session)=>setUser(session?.user ?? null));
    supabaseBrowser.from('assets').select('id,title,description,price_cents,currency').eq('status','published').order('created_at',{ascending:false}).then(({data})=>setAssets(data ?? []));
    return () => listener.subscription.unsubscribe();
  },[]);

  async function signIn(){
    setLoading(true); setMessage('');
    const {error}=await supabaseBrowser.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
    setLoading(false); setMessage(error ? error.message : 'Check your email for the VoxelVault sign-in link.');
  }

  async function buy(assetId){
    if(String(assetId).startsWith('demo-')){setMessage('Preview NFT selected. Connect a published listing to enable checkout.');return;}
    if(!user){setMessage('Connect your account first, then choose Collect NFT.');return;}
    setLoading(true); setMessage('Opening secure checkout…');
    const {data:{session}}=await supabaseBrowser.auth.getSession();
    const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token ?? ''}`},body:JSON.stringify({assetId})});
    const result=await response.json(); setLoading(false);
    if(!response.ok){setMessage(result.error || 'Checkout failed.');return;}
    window.location.href=result.url;
  }

  const liveNFTs=useMemo(()=>assets.map((asset,i)=>({...asset,creator:'VoxelVault Creator',price:(asset.price_cents||0)/100,rarity:['Rare','Epic','Legendary'][i%3],type:['Voxel','Character','World'][i%3],style:['game','realistic','fantasy'][i%3],color:['violet','cyan','gold'][i%3]})),[assets]);
  const listings=[...liveNFTs,...demoNFTs].filter(n=>filter==='All'||n.type===filter||n.rarity===filter||n.style===filter);

  return <main className="vault">
    <style>{styles}</style>
    <nav className="nav">
      <div className="brand"><span className="brandMark">V</span><span>VOXEL<span className="accent">VAULT</span></span></div>
      <div className="navLinks"><a href="#explore">Explore</a><a href="#collections">Collections</a><a href="#creators">Creators</a><a href="#create">Create</a></div>
      <div className="navRight">{user?<span className="walletPill">● {user.email}</span>:<button className="ghostBtn" onClick={()=>document.getElementById('signin')?.scrollIntoView({behavior:'smooth'})}>Connect</button>}</div>
    </nav>

    <section className="hero">
      <div className="heroCopy">
        <div className="eyebrow"><span/> THE 3D NFT MARKETPLACE</div>
        <h1>Own the<br/><em>digital dimension.</em></h1>
        <p>Discover, collect and trade real 3D voxel NFTs built for games, VR, worlds, creators and digital collectors.</p>
        <div className="heroActions"><a className="primaryBtn" href="#explore">Explore 3D NFTs <b>↗</b></a><a className="secondaryBtn" href="#create">Create an NFT</a></div>
        <div className="stats"><div><strong>12K+</strong><span>3D assets</span></div><div><strong>2.4K</strong><span>creators</span></div><div><strong>24/7</strong><span>on-chain ready</span></div></div>
      </div>
      <div className="heroVisual"><div className="orbit orbitA"/><div className="orbit orbitB"/><VoxelModel/><div className="floatTag tag1">◈ 3D VOXEL</div><div className="floatTag tag2">VR READY</div><div className="floatTag tag3">REAL-TIME ROTATION</div></div>
    </section>

    <section className="ticker"><span>✦ GAME-READY VOXELS</span><span>✦ REALISTIC 3D OBJECTS</span><span>✦ VERIFIED CREATORS</span><span>✦ SPATIAL COMPUTING</span></section>

    <section className="market" id="explore">
      <div className="sectionHead"><div><div className="eyebrow">EXPLORE THE VAULT</div><h2>Fresh drops</h2><p className="sectionIntro">From chunky game assets to dense realistic voxel sculptures.</p></div>
        <div className="filters">{['All','Voxel','Character','Creature','Vehicle','Architecture','Artifact','World','game','realistic','fantasy','Rare','Epic','Legendary'].map(x=><button key={x} className={filter===x?'activeFilter':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>
      </div>
      <div className="grid">{listings.map(n=><article className="nftCard" key={n.id}>
        <div className="cardVisual"><VoxelModel style={n.style} color={n.color} compact/><span className="rarity">{n.rarity}</span><span className="styleBadge">{n.style==='realistic'?'REALISTIC 3D':n.style==='fantasy'?'FANTASY VOXEL':'GAME VOXEL'}</span><button className="viewBtn">↗</button></div>
        <div className="cardBody"><div><h3>{n.title}</h3><p>by <b>{n.creator}</b></p></div><div className="price"><span>Price</span><strong>{Number(n.price).toFixed(3)} ETH</strong></div></div>
        <button className="buyBtn" onClick={()=>buy(n.id)} disabled={loading}>Collect NFT <span>→</span></button>
      </article>)}</div>
    </section>

    <section className="collectionBand" id="collections"><div><div className="eyebrow">BUILT FOR 3D COLLECTORS</div><h2>One vault.<br/><em>Every kind of voxel.</em></h2><p>Game characters. Vehicles. Buildings. Creatures. Real-world objects. Dense realistic voxel art. The gallery is designed to make every model feel like a collectible object, not a flat thumbnail.</p></div><div className="collectionShow"><VoxelModel style="realistic" color="gold"/><div className="collectionLabel">REALISTIC VOXEL STUDY<br/><b>HIGH DETAIL / SPATIAL READY</b></div></div></section>

    <section className="creatorSection" id="creators"><div><div className="eyebrow">FOR CREATORS</div><h2>Turn your 3D work<br/>into <em>collectible worlds.</em></h2><p>Upload your models, set your price, publish your collection and deliver purchased assets securely through VoxelVault.</p><a className="primaryBtn" href="#create">Start creating <b>↗</b></a></div><div className="creatorPanel"><VoxelModel style="game" color="cyan" compact/><div><span>CREATOR ECONOMY</span><strong>Own your<br/>distribution.</strong></div></div></section>

    <section className="signin" id="signin"><div><div className="eyebrow">YOUR VAULT</div><h2>Enter the collection.</h2><p>Sign in with a magic link to manage your NFTs and purchases.</p></div><div className="signForm">{user?<div className="walletPill">● Signed in as {user.email}</div>:<><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email"/><button className="primaryBtn" disabled={loading||!email} onClick={signIn}>Send magic link →</button></>}{message&&<small>{message}</small>}</div></section>

    <section className="create" id="create"><div className="createGrid"><div><div className="eyebrow">CREATE IN VOXEL VAULT</div><h2>Make something<br/><em>worth rotating.</em></h2><p>Bring in GLB/GLTF voxel models, build collections and prepare them for marketplace ownership. The visual system is ready for game-style and realistic voxel assets.</p><div className="createPills"><span>GLB / GLTF</span><span>3D PREVIEWS</span><span>IPFS READY</span><span>NFT READY</span></div></div><div className="createModel"><VoxelModel style="fantasy" color="pink"/></div></div></section>

    <footer><div className="brand"><span className="brandMark">V</span><span>VOXEL<span className="accent">VAULT</span></span></div><span>3D assets. Digital ownership. Infinite worlds.</span><span>© 2026 VoxelVault</span></footer>
  </main>;
}

const styles=`
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#05060a;color:#f5f7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.vault{min-height:100vh;background:radial-gradient(circle at 72% 8%,rgba(92,54,255,.16),transparent 30%),radial-gradient(circle at 10% 55%,rgba(0,210,255,.05),transparent 25%),#05060a}.nav{height:78px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;padding:0 5vw;position:sticky;top:0;z-index:20;background:rgba(5,6,10,.82);backdrop-filter:blur(18px)}.brand{display:flex;align-items:center;gap:11px;font-size:15px;font-weight:900;letter-spacing:2px}.brandMark{width:31px;height:31px;display:grid;place-items:center;border:1px solid #8c6cff;border-radius:9px;color:#fff;background:linear-gradient(135deg,#6d48ff,#a178ff);box-shadow:0 0 28px rgba(124,84,255,.45)}.accent{color:#9a7cff}.navLinks{display:flex;gap:28px}.navLinks a{color:#9ca3b7;text-decoration:none;font-size:12px}.navLinks a:hover{color:#fff}.navRight{min-width:100px;text-align:right}.ghostBtn,.secondaryBtn{background:transparent;border:1px solid #303446;color:#fff;padding:11px 18px;border-radius:10px;font-weight:700;cursor:pointer}.walletPill{display:inline-block;padding:10px 14px;border:1px solid #31364a;border-radius:999px;color:#b8c0d4;font-size:12px;max-width:240px;overflow:hidden;text-overflow:ellipsis}.hero{max-width:1280px;margin:auto;min-height:690px;padding:80px 5vw 60px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px}.eyebrow{font-size:11px;letter-spacing:2.5px;font-weight:900;color:#8970ff;display:flex;align-items:center;gap:9px}.eyebrow span{width:7px;height:7px;border-radius:50%;background:#8b6bff;box-shadow:0 0 15px #8b6bff}.hero h1{font-size:clamp(58px,7vw,104px);line-height:.88;letter-spacing:-5px;margin:22px 0}.hero h1 em,.collectionBand em,.creatorSection em,.create em{font-style:normal;color:#987bff}.heroCopy>p{max-width:560px;color:#a3a9ba;font-size:18px;line-height:1.65}.heroActions{display:flex;gap:12px;margin-top:32px}.primaryBtn{display:inline-flex;align-items:center;gap:20px;border:0;border-radius:11px;padding:14px 19px;background:#8a68ff;color:white;text-decoration:none;font-weight:850;box-shadow:0 12px 40px rgba(112,76,255,.28);cursor:pointer}.primaryBtn b{font-size:18px}.stats{display:flex;gap:45px;margin-top:55px}.stats div{display:flex;flex-direction:column;gap:4px}.stats strong{font-size:22px}.stats span{font-size:11px;color:#71788c;text-transform:uppercase;letter-spacing:1px}.heroVisual{height:560px;position:relative;display:grid;place-items:center;overflow:hidden}.orbit{position:absolute;border:1px solid rgba(145,116,255,.22);border-radius:50%;width:470px;height:160px;transform:rotate(-25deg)}.orbitB{width:520px;height:220px;transform:rotate(55deg);border-color:rgba(66,201,255,.15)}.floatTag{position:absolute;background:rgba(13,14,22,.78);border:1px solid #35324c;border-radius:8px;padding:9px 12px;font-size:9px;letter-spacing:1.5px;color:#d9d3f8;backdrop-filter:blur(10px)}.tag1{top:18%;right:3%}.tag2{bottom:20%;left:2%}.tag3{top:70%;right:7%;color:#a9a1c7}.voxelScene{width:410px;height:410px;position:relative;display:grid;place-items:center;perspective:1000px}.voxelScene.compact{width:100%;height:100%}.voxelModel{width:240px;height:240px;position:relative;transform-style:preserve-3d;animation:floatSpin 18s linear infinite;filter:drop-shadow(0 0 45px rgba(122,82,255,.4))}.voxelModel i{position:absolute;width:34px;height:34px;border:1px solid rgba(255,255,255,.16);border-radius:3px;transform:translate3d(calc((var(--i)%5)*36px - 72px),calc((floor(var(--i)/5)%5)*36px - 72px),calc((var(--i)%3)*34px - 34px));box-shadow:inset 3px 3px 0 rgba(255,255,255,.12),inset -4px -5px 0 rgba(0,0,0,.2)}.voxelModel i:nth-child(3n){transform:translate3d(calc((var(--i)%5)*36px - 72px),calc((floor(var(--i)/5)%5)*36px - 72px),34px)}.voxelModel.game i{background:linear-gradient(135deg,#8d6cff,#4328a9)}.voxelModel.realistic i{background:linear-gradient(135deg,#c6b6ff,#4e426d);border-color:rgba(255,255,255,.28)}.voxelModel.fantasy i{background:linear-gradient(135deg,#ff75d8,#7439b7)}.voxelModel.cyan i{background:linear-gradient(135deg,#4ee7ff,#155a9e)}.voxelModel.gold i{background:linear-gradient(135deg,#ffe18b,#8c5a15)}.voxelModel.green i{background:linear-gradient(135deg,#8df5a4,#216b45)}.voxelModel.blue i{background:linear-gradient(135deg,#7da8ff,#234486)}.voxelModel.orange i{background:linear-gradient(135deg,#ffbf68,#a64c19)}.voxelModel.pink i{background:linear-gradient(135deg,#ff9ce8,#8e3d9c)}.voxelScene.compact .voxelModel{transform:scale(.48)}.voxelShadow{position:absolute;bottom:28px;width:300px;height:65px;background:radial-gradient(ellipse,rgba(111,73,255,.48),transparent 70%);filter:blur(10px)}.ticker{border-block:1px solid rgba(255,255,255,.07);padding:17px 5vw;display:flex;justify-content:space-between;gap:20px;overflow:hidden;color:#696f82;font-size:9px;letter-spacing:2px}.market{max-width:1280px;margin:auto;padding:105px 5vw}.sectionHead{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:35px}.sectionHead h2,.collectionBand h2,.creatorSection h2,.signin h2,.create h2{font-size:48px;letter-spacing:-2px;margin:10px 0}.sectionIntro{color:#777e91;margin:0}.filters{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:610px}.filters button{background:#0b0d14;color:#747b90;border:1px solid #1c2030;border-radius:999px;padding:8px 11px;font-size:10px;cursor:pointer}.filters .activeFilter{color:#fff;border-color:#7255db;background:#19132f}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.nftCard{background:linear-gradient(145deg,#10121a,#090a0f);border:1px solid #1d2030;border-radius:15px;overflow:hidden;transition:.25s}.nftCard:hover{transform:translateY(-5px);border-color:#51427f;box-shadow:0 20px 55px rgba(0,0,0,.35)}.cardVisual{height:245px;position:relative;background:radial-gradient(circle at 50% 45%,rgba(111,77,255,.18),transparent 58%),#080a11}.rarity,.styleBadge{position:absolute;top:12px;padding:7px 9px;border-radius:6px;background:rgba(9,10,16,.72);border:1px solid #292b3b;font-size:8px;letter-spacing:1px}.rarity{left:12px;color:#c5b9ff}.styleBadge{right:12px;color:#8d9bb8}.viewBtn{position:absolute;bottom:12px;right:12px;width:31px;height:31px;border:1px solid #33364a;border-radius:8px;background:rgba(8,9,15,.75);color:#fff;cursor:pointer}.cardBody{display:flex;justify-content:space-between;gap:12px;padding:18px 16px 13px}.cardBody h3{font-size:14px;margin:0 0 5px}.cardBody p{font-size:10px;color:#676e82;margin:0}.cardBody p b{color:#a5abc0}.price{text-align:right}.price span{display:block;font-size:8px;color:#60677a;text-transform:uppercase;letter-spacing:1px}.price strong{font-size:12px}.buyBtn{margin:0 16px 16px;width:calc(100% - 32px);padding:11px 12px;border:1px solid #30294e;border-radius:9px;background:#171226;color:#d8d0ff;font-weight:800;cursor:pointer;display:flex;justify-content:space-between}.buyBtn:hover{background:#211a3c}.collectionBand{max-width:1280px;margin:0 auto;padding:95px 5vw;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center;border-top:1px solid rgba(255,255,255,.06)}.collectionBand p,.creatorSection p,.signin p,.create p{color:#858c9e;line-height:1.7;max-width:560px}.collectionShow{height:440px;position:relative;display:grid;place-items:center;border:1px solid #242538;border-radius:22px;background:radial-gradient(circle,rgba(140,105,255,.16),transparent 60%),#080a11;overflow:hidden}.collectionLabel{position:absolute;bottom:20px;left:20px;font-size:9px;letter-spacing:1.5px;color:#737b91}.collectionLabel b{color:#c5baff}.creatorSection{max-width:1280px;margin:auto;padding:105px 5vw;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}.creatorPanel{min-height:330px;border:1px solid #25283a;border-radius:20px;background:linear-gradient(145deg,#0e1018,#08090e);display:flex;align-items:center;gap:20px;padding:30px}.creatorPanel span{display:block;color:#777e93;font-size:9px;letter-spacing:2px;margin-bottom:12px}.creatorPanel strong{font-size:28px;line-height:1.05}.signin{border-block:1px solid rgba(255,255,255,.07);padding:70px 5vw;display:flex;justify-content:space-between;gap:40px;align-items:center;background:#07080d}.signForm{display:flex;flex-wrap:wrap;gap:10px;max-width:520px}.signForm input{min-width:260px;flex:1;background:#0b0d14;border:1px solid #292d40;color:#fff;border-radius:10px;padding:14px}.signForm small{width:100%;color:#8b91a3}.create{max-width:1280px;margin:auto;padding:110px 5vw}.createGrid{min-height:430px;border:1px solid #25283a;border-radius:24px;padding:60px;display:grid;grid-template-columns:1fr 1fr;align-items:center;background:radial-gradient(circle at 75% 40%,rgba(136,91,255,.18),transparent 38%),#090b12}.createPills{display:flex;flex-wrap:wrap;gap:8px;margin-top:25px}.createPills span{border:1px solid #292d40;border-radius:999px;padding:8px 11px;font-size:9px;color:#8e96aa}.createModel{height:340px;display:grid;place-items:center}footer{padding:30px 5vw;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;gap:20px;color:#666d80;font-size:10px;align-items:center}@keyframes floatSpin{0%{transform:rotateX(-14deg) rotateY(0deg) translateY(0)}50%{transform:rotateX(14deg) rotateY(180deg) translateY(-14px)}100%{transform:rotateX(-14deg) rotateY(360deg) translateY(0)}}@media(max-width:950px){.navLinks{display:none}.hero,.collectionBand,.creatorSection,.createGrid{grid-template-columns:1fr}.hero{padding-top:50px}.heroVisual{height:450px}.grid{grid-template-columns:repeat(2,1fr)}.sectionHead{align-items:flex-start;flex-direction:column}.filters{justify-content:flex-start}.signin,footer{flex-direction:column;align-items:flex-start}.collectionBand,.creatorSection,.market,.create{padding-top:70px;padding-bottom:70px}}@media(max-width:560px){.hero h1{font-size:56px}.grid{grid-template-columns:1fr}.stats{gap:22px}.stats strong{font-size:18px}.heroVisual{height:390px}.voxelScene{transform:scale(.82)}.createGrid{padding:30px}.sectionHead h2,.collectionBand h2,.creatorSection h2,.signin h2,.create h2{font-size:38px}}
`;
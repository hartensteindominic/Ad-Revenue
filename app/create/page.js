'use client';

import { useEffect, useMemo, useState } from 'react';
import VoxelViewer from '../components/VoxelViewer';

const SHAPES = [['car','Midnight GT'],['robot','Astra Robot'],['ship','Deep Space Hauler'],['villa','Modern Villa'],['owl','Forest Owl'],['fox','Red Fox'],['statue','Marble Guardian'],['tree','Crystal Tree']];
const NFT_ABI = [
  'function mint(string uri,uint96 royaltyBps) returns (uint256 tokenId)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'event VoxelMinted(uint256 indexed tokenId,address indexed creator,string tokenURI,uint96 royaltyBps)'
];
const MAINNET_CHAIN_HEX='0x1';

function dataUri(json){ return `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(json))))}`; }

async function getProvider(){
  if(typeof window==='undefined') throw new Error('Wallet is only available in the browser.');
  const provider=window.__VV_EVM_PROVIDER || window.ethereum;
  if(!provider) throw new Error('Connect a wallet first.');
  return provider;
}

async function ensureMainnet(provider){
  const chain=await provider.request({method:'eth_chainId'});
  if(chain===MAINNET_CHAIN_HEX) return;
  try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:MAINNET_CHAIN_HEX}]}); }
  catch(error){
    if(error?.code!==4902) throw error;
    await provider.request({method:'wallet_addEthereumChain',params:[{chainId:MAINNET_CHAIN_HEX,chainName:'Ethereum Mainnet',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:['https://cloudflare-eth.com'],blockExplorerUrls:['https://etherscan.io']} ]});
  }
}

export default function CreatorStudio(){
  const [shape,setShape]=useState('car');
  const [name,setName]=useState('My Voxel Creation');
  const [description,setDescription]=useState('A collectible 3D voxel creation made in Voxel Vault.');
  const [royalty,setRoyalty]=useState('500');
  const [saved,setSaved]=useState(false);
  const [autoRotate,setAutoRotate]=useState(true);
  const [minting,setMinting]=useState(false);
  const [mintStatus,setMintStatus]=useState('');
  const [mintedToken,setMintedToken]=useState('');
  const [walletAddress,setWalletAddress]=useState('');

  useEffect(()=>{
    try{const raw=localStorage.getItem('vv-draft');if(raw){const d=JSON.parse(raw);if(d.name)setName(d.name);if(d.description)setDescription(d.description);if(d.shape)setShape(d.shape);if(d.royaltyBps)setRoyalty(String(d.royaltyBps));}}catch{}
    const sync=()=>setWalletAddress(localStorage.getItem('vv-wallet-address')||'');
    sync(); window.addEventListener('vv-wallet-connected',sync); window.addEventListener('storage',sync);
    return()=>{window.removeEventListener('vv-wallet-connected',sync);window.removeEventListener('storage',sync)};
  },[]);

  const selected=useMemo(()=>SHAPES.find(([id])=>id===shape)?.[1]||'Voxel Creation',[shape]);
  const contractAddress=process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS;

  function saveDraft(){
    localStorage.setItem('vv-draft',JSON.stringify({name,description,shape,royaltyBps:Number(royalty),updatedAt:new Date().toISOString()}));
    setSaved(true);setTimeout(()=>setSaved(false),1800);
  }
  function exportDraft(){
    const payload={name,description,shape,royaltyBps:Number(royalty),format:'voxel-vault-draft',version:2,createdAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'voxel-creation'}.json`;a.click();URL.revokeObjectURL(url);
  }

  async function mint(){
    if(minting)return;
    setMintStatus('');setMintedToken('');
    try{
      if(!contractAddress) throw new Error('NFT contract address is not configured yet. Add NEXT_PUBLIC_VOXEL_NFT_ADDRESS to the deployment environment.');
      const provider=await getProvider(); await ensureMainnet(provider);
      const accounts=await provider.request({method:'eth_requestAccounts'});const account=accounts?.[0];if(!account)throw new Error('No wallet account is connected.');
      const ethers=await import('ethers');
      const browserProvider=new ethers.BrowserProvider(provider);const signer=await browserProvider.getSigner();
      const contract=new ethers.Contract(contractAddress,NFT_ABI,signer);
      const royaltyBps=Math.min(1500,Math.max(0,Number(royalty)||0));
      const metadata={name:name.trim()||'Voxel Creation',description:description.trim(),external_url:typeof window!=='undefined'?`${window.location.origin}/create`:undefined,attributes:[{trait_type:'Voxel Type',value:selected},{trait_type:'Format',value:'3D Voxel'},{trait_type:'Creator',value:account},{trait_type:'Royalty',value:`${royaltyBps/100}%`}],properties:{shape,version:2}};
      setMinting(true);setMintStatus('Waiting for wallet approval…');
      const tx=await contract.mint(dataUri(metadata),royaltyBps);
      setMintStatus('Transaction submitted. Waiting for confirmation…');
      const receipt=await tx.wait();
      let tokenId='';
      for(const log of receipt.logs){try{const parsed=contract.interface.parseLog(log);if(parsed?.name==='VoxelMinted'){tokenId=parsed.args.tokenId.toString();break;}}catch{}}
      setMintedToken(tokenId);setMintStatus(tokenId?`Minted successfully · Token #${tokenId}`:'Minted successfully on Ethereum mainnet.');
      saveDraft();
    }catch(error){
      setMintStatus(error?.code===4001?'Transaction cancelled in wallet':error?.shortMessage||error?.message||'Mint failed.');
    }finally{setMinting(false)}
  }

  return <main className="studio"><style>{styles}</style>
    <header className="studioNav"><a className="brand" href="/"><span className="mark">V</span><span>VOXEL<span>VAULT</span></span></a><div className="crumb">CREATOR STUDIO <b>/</b> {selected.toUpperCase()}</div><div className="navActions"><a href="/">← Back to Vault</a><button onClick={saveDraft}>{saved?'✓ Saved':'Save Draft'}</button></div></header>
    <section className="studioGrid">
      <aside className="panel left"><div className="kicker">01 · BUILD</div><h1>Make your<br/><em>voxel.</em></h1><p className="intro">Create a 3D object, prepare its metadata, then mint ownership directly from your connected wallet.</p>
        <label>OBJECT BLUEPRINT</label><div className="shapeGrid">{SHAPES.map(([id,title])=><button key={id} className={shape===id?'selected':''} onClick={()=>setShape(id)}><span>◈</span>{title}</button>)}</div>
        <label>CREATION NAME</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={80}/>
        <label>DESCRIPTION</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} maxLength={500}/>
        <label>CREATOR ROYALTY · BPS</label><input type="number" min="0" max="1500" step="50" value={royalty} onChange={e=>setRoyalty(e.target.value)}/><div className="muted">0–1500 BPS · maximum 15%</div>
        <div className="toolRow"><button className={autoRotate?'tool active':'tool'} onClick={()=>setAutoRotate(v=>!v)}>↻ Auto rotate</button><button className="tool" onClick={exportDraft}>⇩ Export draft</button></div>
      </aside>
      <section className="canvasPanel"><div className="canvasTop"><span>LIVE 3D PREVIEW</span><span>WEBGL · INTERACTIVE</span></div><div className="canvas"><VoxelViewer key={shape+autoRotate} shape={shape} showcase={!autoRotate}/></div><div className="canvasBottom"><div><strong>{selected}</strong><span>Interactive voxel geometry</span></div><div className="canvasHint">DRAG TO ORBIT · SCROLL TO ZOOM · CLICK BLOCKS</div></div></section>
      <aside className="panel right"><div className="kicker">02 · MINT</div><h2>Make it<br/><em>on-chain.</em></h2><div className={walletAddress?'status good':'status'}><span/> {walletAddress?`Wallet ${walletAddress.slice(0,6)}…${walletAddress.slice(-4)}`:'Connect a wallet to mint'}</div>
        <div className="specs"><div><span>FORMAT</span><strong>3D VOXEL</strong></div><div><span>CHAIN</span><strong>ETHEREUM MAINNET</strong></div><div><span>ROYALTY</span><strong>{(Math.min(1500,Math.max(0,Number(royalty)||0))/100).toFixed(2)}%</strong></div><div><span>CONTRACT</span><strong>{contractAddress?`${contractAddress.slice(0,6)}…${contractAddress.slice(-4)}`:'NOT CONFIGURED'}</strong></div></div>
        <div className="pipeline"><div className="done"><i>✓</i><span><b>3D preview</b>Interactive object loaded</span></div><div className="done"><i>✓</i><span><b>Metadata</b>Generated locally for this mint</span></div><div className={contractAddress?'done':''}><i>{contractAddress?'✓':'03'}</i><span><b>NFT contract</b>{contractAddress?'Contract address configured':'Waiting for mainnet deployment configuration'}</span></div><div><i>04</i><span><b>Wallet mint</b>Approve the real ETH transaction in your wallet</span></div></div>
        <button className="mint" disabled={minting} onClick={mint}>{minting?'Minting…':mintedToken?`Minted · Token #${mintedToken}`:'Mint 3D NFT'} <span>→</span></button>
        {mintStatus&&<div className={mintedToken?'mintSuccess':'mintStatus'}>{mintStatus}</div>}
        {!contractAddress&&<div className="configWarning">Mainnet minting is locked until the deployed Ethereum mainnet NFT contract address is supplied.</div>}
        <small>Metadata is generated in the browser for this first mint path. Never enter a recovery phrase here. Mainnet transactions use real ETH and always require wallet approval.</small>
      </aside>
    </section>
  </main>;
}

const styles=`*{box-sizing:border-box}body{margin:0;background:#05060a;color:#f6f7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.studio{min-height:100vh;background:radial-gradient(circle at 48% 42%,rgba(108,77,255,.10),transparent 31%),radial-gradient(circle at 90% 0,rgba(36,211,255,.055),transparent 24%),#05060a}.studioNav{height:74px;padding:0 3vw;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;background:rgba(5,6,10,.84);backdrop-filter:blur(18px);position:sticky;top:0;z-index:10}.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:13px;font-weight:950;letter-spacing:2px}.brand span span{color:#987cff}.mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#6847ff,#a57fff);box-shadow:0 0 28px rgba(117,79,255,.35)}.crumb{font-size:9px;letter-spacing:2px;color:#70778b}.crumb b{color:#373b4a;margin:0 8px}.navActions{display:flex;align-items:center;gap:9px}.navActions a,.navActions button{font:inherit;font-size:10px;font-weight:800;text-decoration:none;color:#aeb4c5;border:1px solid #282c3b;background:#0d0f16;padding:10px 13px;border-radius:9px}.navActions button{color:#fff;cursor:pointer}.studioGrid{min-height:calc(100vh - 74px);display:grid;grid-template-columns:330px minmax(400px,1fr) 310px;gap:1px;background:#191b25}.panel,.canvasPanel{background:#070910}.panel{padding:30px 24px}.kicker{color:#8970ff;font-size:9px;letter-spacing:2.5px;font-weight:950}.panel h1{font-size:43px;line-height:.88;letter-spacing:-2px;margin:15px 0}.panel h2{font-size:31px;line-height:.94;letter-spacing:-1.5px;margin:14px 0 12px}.panel em{font-style:normal;color:#997dff}.intro{font-size:11px;line-height:1.7;color:#7f8799;margin:0 0 26px}.panel label{display:block;margin:21px 0 8px;color:#666d7f;font-size:8px;letter-spacing:1.8px;font-weight:900}.shapeGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.shapeGrid button{padding:10px 8px;border:1px solid #222632;border-radius:8px;background:#0c0e15;color:#969dae;text-align:left;font-size:9px;cursor:pointer}.shapeGrid button span{color:#6951d7;margin-right:6px}.shapeGrid button:hover,.shapeGrid button.selected{border-color:#6951d7;color:#fff;background:#141126}.panel input,.panel textarea{width:100%;border:1px solid #282c3a;border-radius:9px;background:#0b0d14;color:#fff;padding:11px;font:inherit;font-size:10px;outline:none;resize:vertical}.panel input:focus,.panel textarea:focus{border-color:#7659ff}.muted{font-size:8px;color:#596174;margin-top:5px}.toolRow{display:flex;gap:6px;margin-top:15px}.tool{flex:1;padding:10px;border:1px solid #292d3c;background:#0d0f16;color:#8f96a8;border-radius:8px;font-size:9px;cursor:pointer}.tool.active{color:#fff;border-color:#6650cf;background:#151129}.canvasPanel{display:flex;flex-direction:column;min-width:0}.canvasTop,.canvasBottom{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #1a1d27;color:#697083;font-size:8px;letter-spacing:1.6px;font-weight:900}.canvasBottom{border-top:1px solid #1a1d27;border-bottom:0;letter-spacing:0;text-transform:none}.canvasBottom div{display:flex;flex-direction:column;gap:4px}.canvasBottom strong{font-size:12px;color:#fff}.canvasBottom span{font-size:8px;color:#697083}.canvasHint{font-size:8px!important;letter-spacing:1.1px}.canvas{flex:1;min-height:520px;background:radial-gradient(circle at 50% 45%,rgba(108,75,255,.11),transparent 35%)}.canvas .voxelViewer{height:100%;min-height:520px;border-radius:0}.right{padding:30px 22px}.status{display:flex;align-items:center;gap:7px;color:#7e879a;font-size:9px;margin:18px 0}.status span{width:6px;height:6px;border-radius:50%;background:#7f62ff;box-shadow:0 0 10px #7f62ff}.status.good{color:#a8b2c7}.status.good span{background:#53e2a1;box-shadow:0 0 10px #53e2a1}.specs{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #20232e;border-bottom:1px solid #20232e}.specs div{padding:13px 4px;border-bottom:1px solid #20232e}.specs div:nth-child(odd){border-right:1px solid #20232e}.specs div:nth-last-child(-n+2){border-bottom:0}.specs span{display:block;color:#626a7b;font-size:7px;letter-spacing:1.3px;margin-bottom:5px}.specs strong{font-size:9px}.pipeline{margin-top:25px;display:grid;gap:16px}.pipeline>div{display:flex;gap:10px;align-items:flex-start;color:#666e80;font-size:9px;line-height:1.45}.pipeline i{width:21px;height:21px;display:grid;place-items:center;border:1px solid #303442;border-radius:7px;font-style:normal;font-size:8px;flex:none}.pipeline .done{color:#9da5b6}.pipeline .done i{border-color:#5c48b4;background:#16112b;color:#a990ff}.pipeline span{display:flex;flex-direction:column;gap:2px}.pipeline b{color:#dce0eb;font-size:10px}.mint{width:100%;margin-top:27px;padding:13px;border:0;border-radius:10px;background:linear-gradient(135deg,#7656ff,#9a76ff);color:#fff;font-weight:950;font-size:11px;cursor:pointer;box-shadow:0 14px 35px rgba(112,78,255,.2)}.mint:disabled{opacity:.55;cursor:wait}.mint span{float:right}.mintStatus,.mintSuccess,.configWarning{margin-top:10px;padding:10px;border-radius:9px;font-size:8px;line-height:1.5}.mintStatus{background:#11131d;border:1px solid #292d3b;color:#a7aec0}.mintSuccess{background:#0d1d18;border:1px solid #245b46;color:#8ce0bb}.configWarning{background:#1b160b;border:1px solid #59431b;color:#d8bd79}.right small{display:block;color:#555d70;font-size:8px;line-height:1.6;margin-top:12px}@media(max-width:1050px){.studioGrid{grid-template-columns:280px minmax(380px,1fr)}.right{display:none}}@media(max-width:720px){.studioNav{padding:0 14px}.crumb{display:none}.navActions a{display:none}.studioGrid{display:block}.panel.left{padding:22px 18px}.canvas{min-height:430px}.canvas .voxelViewer{min-height:430px}.panel h1{font-size:38px}.shapeGrid{grid-template-columns:repeat(4,1fr)}.shapeGrid button{font-size:0;text-align:center}.shapeGrid button span{margin:0;font-size:13px}.toolRow{padding-bottom:8px}}`;

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWalletIdentity } from '../components/WalletIdentity';

const NFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner,uint256 index) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

const CONTRACT = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';

async function loadOwned(address) {
  if (!window.ethereum || !CONTRACT) return { mode: 'not-configured', items: [] };
  const { BrowserProvider, Contract } = await import('ethers');
  const provider = new BrowserProvider(window.ethereum);
  const contract = new Contract(CONTRACT, NFT_ABI, provider);
  const balance = Number(await contract.balanceOf(address));
  const items = [];
  for (let i = 0; i < Math.min(balance, 100); i += 1) {
    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
    let tokenUri = '';
    try { tokenUri = await contract.tokenURI(tokenId); } catch {}
    items.push({ tokenId: tokenId.toString(), tokenUri });
  }
  return { mode: 'on-chain', items };
}

export default function VaultPage() {
  const { address, connected, connect, refresh } = useWalletIdentity();
  const [state, setState] = useState({ mode: 'idle', items: [] });
  const [error, setError] = useState('');

  const short = useMemo(() => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '', [address]);

  async function sync() {
    if (!address) return;
    setError('');
    setState({ mode: 'loading', items: [] });
    try { setState(await loadOwned(address)); }
    catch (e) { setError(e?.message || 'Could not read your on-chain collection.'); setState({ mode: 'error', items: [] }); }
  }

  useEffect(() => { sync(); }, [address]);

  useEffect(() => {
    const handler = () => { refresh(); };
    window.addEventListener('voxel-vault:transaction-confirmed', handler);
    return () => window.removeEventListener('voxel-vault:transaction-confirmed', handler);
  }, [refresh]);

  if (!connected) return <main className="min-h-screen bg-[#05060c] text-white grid place-items-center p-6"><section className="max-w-md text-center"><div className="text-xs tracking-[.3em] opacity-60">MY VAULT</div><h1 className="text-4xl font-semibold mt-3">Your collection lives here.</h1><p className="opacity-70 mt-4">Connect the same wallet you use across Voxel Vault to see verified on-chain ownership.</p><button onClick={connect} className="mt-7 rounded-full px-6 py-3 bg-white text-black font-semibold">Connect wallet</button></section></main>;

  return <main className="min-h-screen bg-[#05060c] text-white px-5 py-8 md:px-10">
    <section className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4"><div><div className="text-xs tracking-[.3em] opacity-60">MY VAULT</div><h1 className="text-4xl md:text-6xl font-semibold mt-2">Your objects.</h1><p className="opacity-60 mt-2">{short} · on-chain ownership</p></div><button onClick={sync} className="rounded-full border border-white/15 px-4 py-2 text-sm">Refresh</button></div>
      {error && <div role="alert" className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">{error}</div>}
      {state.mode === 'not-configured' && <div className="mt-10 rounded-3xl border border-white/10 p-8"><h2 className="text-xl font-semibold">Live collection is not configured yet.</h2><p className="opacity-60 mt-2">Voxel Vault will never pretend demo objects are blockchain-owned.</p></div>}
      {state.mode === 'loading' && <div className="mt-10 grid md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-56 rounded-3xl bg-white/5 animate-pulse" />)}</div>}
      {state.mode === 'on-chain' && !state.items.length && <div className="mt-10 rounded-3xl border border-white/10 p-10 text-center"><div className="text-5xl">🧊</div><h2 className="text-2xl font-semibold mt-3">Your Vault is waiting.</h2><p className="opacity-60 mt-2">Collect your first Voxel Vault object and it will appear here automatically.</p></div>}
      {state.mode === 'on-chain' && state.items.length > 0 && <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{state.items.map(item => <article key={item.tokenId} className="rounded-3xl border border-white/10 bg-white/[.04] p-5"><div className="aspect-square rounded-2xl bg-black/40 grid place-items-center text-6xl">◈</div><div className="mt-4"><div className="text-xs opacity-50">VERIFIED ON-CHAIN</div><h2 className="text-xl font-semibold">Voxel #{item.tokenId}</h2>{item.tokenUri && <a className="text-sm opacity-60 underline" href={item.tokenUri} target="_blank" rel="noreferrer">Metadata ↗</a>}</div></article>)}</div>}
    </section>
  </main>;
}

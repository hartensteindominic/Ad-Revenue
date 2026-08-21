'use client';

import React, { useState } from 'react';
import { fetchMetadata, extractAssetUrl } from '@/lib/nft-import';

export default function NFTImportPanel({ resolveToken, onImported }) {
  const [contract, setContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  async function importNft(event) {
    event.preventDefault();
    setStatus('loading');
    setResult(null);
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) throw new Error('Enter a valid contract address.');
      if (!/^\d+$/.test(tokenId)) throw new Error('Enter a valid token ID.');
      if (!resolveToken) throw new Error('NFT import is not connected to a blockchain provider yet.');

      const resolved = await resolveToken(contract, tokenId);
      if (!resolved?.tokenUri) throw new Error('This NFT does not expose token metadata.');
      const metadata = await fetchMetadata(resolved.tokenUri);
      const assetUrl = extractAssetUrl(metadata);
      const imported = {
        contract,
        tokenId,
        owner: resolved.owner || null,
        ownedByConnectedWallet: Boolean(resolved.ownedByConnectedWallet),
        metadata,
        assetUrl,
        verified: Boolean(resolved.owner),
      };
      setResult(imported);
      setStatus('success');
      onImported?.(imported);
    } catch (error) {
      setStatus('error');
      setResult({ error: error?.message || 'Unable to import NFT.' });
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#090b14]/90 p-5 text-white shadow-2xl backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Already minted</p>
        <h2 className="mt-1 text-xl font-semibold">Bring an NFT into your Vault</h2>
        <p className="mt-1 text-sm text-white/55">Resolve its real metadata and verify ownership before showing it as yours.</p>
      </div>
      <form onSubmit={importNft} className="space-y-3">
        <input aria-label="NFT contract address" value={contract} onChange={(e) => setContract(e.target.value.trim())} placeholder="0x contract address" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" />
        <input aria-label="NFT token ID" value={tokenId} onChange={(e) => setTokenId(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="Token ID" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" />
        <button disabled={status === 'loading'} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">
          {status === 'loading' ? 'Verifying on-chain…' : 'Verify & Import'}
        </button>
      </form>
      {status === 'success' && result && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="text-sm font-semibold">{result.ownedByConnectedWallet ? '✓ Verified by your wallet' : 'View only'}</div>
          <div className="mt-1 text-xs text-white/50">{result.owner ? `Owner: ${result.owner}` : 'Owner could not be verified.'}</div>
          <div className="mt-1 text-xs text-white/50">{result.assetUrl ? '3D asset detected.' : 'No supported 3D asset found. Procedural preview can be used instead.'}</div>
        </div>
      )}
      {status === 'error' && <p role="alert" className="mt-4 text-sm text-rose-300">{result?.error}</p>}
    </section>
  );
}

'use client';

import { useEffect } from 'react';

const MAINNET_CHAIN_ID = 1;
let walletConnectProviderPromise = null;

function dappUrl() {
  if (typeof window === 'undefined') return '';
  return encodeURIComponent(window.location.href);
}

function walletLinks() {
  const url = dappUrl();
  return [
    ['MetaMask', `https://metamask.app.link/dapp/${decodeURIComponent(url)}`],
    ['Coinbase Wallet', `https://go.cb-w.com/dapp?cb_url=${url}`],
    ['Trust Wallet', `https://link.trustwallet.com/open_url?coin=60&url=${url}`],
    ['Rainbow', `https://rnbwapp.com/dapp/${decodeURIComponent(url)}`],
    ['OKX Wallet', `okx://wallet/dapp/url?dappUrl=${url}`],
    ['Phantom', `https://phantom.app/ul/browse/${url}`],
  ];
}

function closeModal() { document.getElementById('vv-wallet-modal')?.remove(); }

function announceConnection(name, address, provider) {
  if (!address) return;
  window.__VV_EVM_PROVIDER = provider;
  localStorage.setItem('vv-wallet-address', address);
  localStorage.setItem('vv-wallet-name', name);
  window.dispatchEvent(new CustomEvent('vv-wallet-connected', { detail: { name, address, provider } }));
  document.querySelectorAll('button').forEach((b) => {
    const text = (b.textContent || '').toLowerCase();
    if (text.includes('metamask') || text.includes('connect wallet')) b.textContent = `${name} · ${address.slice(0, 6)}…${address.slice(-4)}`;
  });
}

async function connectProvider(provider, name, button) {
  try {
    if (button) button.textContent = 'Connecting…';
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) throw new Error('No wallet account was returned.');
    announceConnection(name, address, provider);
    closeModal();
  } catch (error) {
    if (button) button.textContent = error?.code === 4001 ? 'Connection cancelled' : 'Connection failed · try again';
  }
}

async function getWalletConnectProvider() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) throw new Error('WalletConnect is not configured yet.');
  if (!walletConnectProviderPromise) {
    walletConnectProviderPromise = import('@walletconnect/ethereum-provider').then(({ EthereumProvider }) =>
      EthereumProvider.init({
        projectId, optionalChains: [MAINNET_CHAIN_ID], showQrModal: true,
        rpcMap: { [MAINNET_CHAIN_ID]: 'https://cloudflare-eth.com' },
        metadata: { name: 'Voxel Vault', description: 'Interactive 3D voxel NFT marketplace', url: window.location.origin, icons: [`${window.location.origin}/icon.png`] },
      })
    );
  }
  return walletConnectProviderPromise;
}

async function connectWalletConnect(button) {
  try {
    button.textContent = 'Opening secure wallet picker…';
    const provider = await getWalletConnectProvider();
    await provider.connect();
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) throw new Error('No wallet account was returned.');
    announceConnection('WalletConnect', address, provider);
    closeModal();
  } catch (error) { button.textContent = error?.message || 'WalletConnect connection failed'; }
}

function showWalletModal() {
  if (document.getElementById('vv-wallet-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'vv-wallet-modal';
  modal.innerHTML = `<div class="vv-wallet-backdrop"><section class="vv-wallet-card" role="dialog" aria-modal="true" aria-label="Choose a wallet"><button class="vv-wallet-close" aria-label="Close wallet picker">×</button><div class="vv-wallet-orb"><span>V</span></div><div class="vv-wallet-kicker">VOXEL VAULT · SECURE CONNECT</div><h2>Choose your wallet</h2><p>Connect to explore ownership, mint 3D creations and use the marketplace. Voxel Vault never asks for your recovery phrase.</p><div class="vv-wallet-list"></div><div class="vv-wallet-status"><span></span> Ethereum mainnet · real ETH transactions require wallet approval</div></section></div>`;
  const style = document.createElement('style');
  style.textContent = `#vv-wallet-modal{position:fixed;inset:0;z-index:99999;font-family:Inter,ui-sans-serif,system-ui;color:#fff}.vv-wallet-backdrop{position:absolute;inset:0;display:grid;place-items:center;padding:18px;background:rgba(2,3,8,.78);backdrop-filter:blur(22px)}.vv-wallet-card{position:relative;width:min(460px,100%);padding:30px;border:1px solid rgba(145,119,255,.28);border-radius:26px;background:linear-gradient(145deg,#111421,#08090f 72%);box-shadow:0 35px 120px rgba(0,0,0,.7),0 0 80px rgba(105,71,255,.12)}.vv-wallet-close{position:absolute;right:16px;top:13px;width:34px;height:34px;border:1px solid #292c3c;border-radius:10px;background:#0d0f17;color:#858b9e;font-size:23px;cursor:pointer}.vv-wallet-orb{width:54px;height:54px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(135deg,#6e4cff,#a57fff);margin-bottom:18px;font-weight:950;font-size:21px}.vv-wallet-kicker{font-size:8px;letter-spacing:2.4px;color:#9b82ff;font-weight:950}.vv-wallet-card h2{margin:8px 0;font-size:30px}.vv-wallet-card p{margin:0 0 20px;color:#9299ab;font-size:12px;line-height:1.65}.vv-wallet-list{display:grid;gap:9px}.vv-wallet-option{width:100%;padding:14px 15px;border:1px solid #292c3d;border-radius:13px;background:#0d0f17;color:#f5f6ff;text-align:left;font-size:12px;font-weight:850;cursor:pointer}.vv-wallet-option:hover{border-color:#7d62ef;background:#151229}.vv-wallet-option.primary{border-color:#7355ed;background:#1b1236}.vv-wallet-status{display:flex;justify-content:center;gap:7px;margin-top:16px;color:#656d80;font-size:9px;text-align:center}.vv-wallet-status span{width:6px;height:6px;border-radius:50%;background:#8c72ff;box-shadow:0 0 10px #8c72ff}@media(max-width:520px){.vv-wallet-card{padding:24px}}`;
  document.head.appendChild(style); document.body.appendChild(modal);
  const list = modal.querySelector('.vv-wallet-list');
  const wcButton = document.createElement('button'); wcButton.className = 'vv-wallet-option primary'; wcButton.textContent = '◎ Connect with WalletConnect'; wcButton.onclick = () => connectWalletConnect(wcButton); list.appendChild(wcButton);
  const discovered = []; const providers = new Map();
  const announce = (event) => { const detail = event.detail; const key = detail?.info?.uuid || detail?.info?.name; if (!detail?.provider || (key && providers.has(key))) return; if (key) providers.set(key, detail.provider); discovered.push([detail.info?.name || 'Browser Wallet', detail.provider]); };
  window.addEventListener('eip6963:announceProvider', announce); window.dispatchEvent(new Event('eip6963:requestProvider'));
  setTimeout(() => { window.removeEventListener('eip6963:announceProvider', announce); discovered.forEach(([name, provider]) => { const b=document.createElement('button'); b.className='vv-wallet-option'; b.textContent=`◈ ${name}`; b.onclick=()=>connectProvider(provider,name,b); list.appendChild(b); }); walletLinks().forEach(([name,href])=>{ if(discovered.some(([n])=>n.toLowerCase().includes(name.toLowerCase())))return; const b=document.createElement('button'); b.className='vv-wallet-option'; b.textContent=`↗ Open with ${name}`; b.onclick=()=>{window.location.href=href}; list.appendChild(b); }); },250);
  modal.querySelector('.vv-wallet-close').onclick=closeModal; modal.querySelector('.vv-wallet-backdrop').onclick=(e)=>{if(e.target===e.currentTarget)closeModal()};
}

export default function WalletBridge() {
  useEffect(() => {
    const onClick = (event) => {
      const target = event.target?.closest?.('button'); if (!target) return;
      const label = (target.textContent || '').toLowerCase(); if (!label.includes('metamask') && !label.includes('connect wallet')) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
      const injected = window.ethereum;
      if (injected && !injected.providers) { connectProvider(injected, injected.isMetaMask ? 'MetaMask' : 'Browser Wallet', target); return; }
      showWalletModal();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}

'use client';

import { useEffect } from 'react';

const SEPOLIA_CHAIN_ID = 11155111;
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

function closeModal() {
  document.getElementById('vv-wallet-modal')?.remove();
}

function setConnectedButtons(name, address) {
  localStorage.setItem('vv-wallet-address', address);
  localStorage.setItem('vv-wallet-name', name);
  document.querySelectorAll('button').forEach((b) => {
    const text = (b.textContent || '').toLowerCase();
    if (text.includes('metamask') || text.includes('connect wallet')) {
      b.textContent = `${name} · ${address.slice(0, 6)}…${address.slice(-4)}`;
    }
  });
}

async function connectProvider(provider, name, button) {
  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (address) {
      setConnectedButtons(name, address);
      closeModal();
    }
  } catch (error) {
    if (button) button.textContent = error?.code === 4001 ? 'Connection cancelled' : (error?.message || 'Connection failed');
  }
}

async function getWalletConnectProvider() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) throw new Error('WalletConnect is not configured yet. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in the Vercel environment variables.');

  if (!walletConnectProviderPromise) {
    walletConnectProviderPromise = import('@walletconnect/ethereum-provider').then(async ({ EthereumProvider }) => {
      return EthereumProvider.init({
        projectId,
        optionalChains: [SEPOLIA_CHAIN_ID],
        showQrModal: true,
        rpcMap: { [SEPOLIA_CHAIN_ID]: 'https://rpc.sepolia.org' },
        metadata: {
          name: 'Voxel Vault',
          description: '3D voxel NFT marketplace',
          url: window.location.origin,
          icons: [`${window.location.origin}/icon.png`],
        },
      });
    });
  }

  return walletConnectProviderPromise;
}

async function connectWalletConnect(button) {
  try {
    if (button) button.textContent = 'Opening WalletConnect…';
    const provider = await getWalletConnectProvider();
    await provider.connect();
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) throw new Error('No wallet account was returned.');
    setConnectedButtons('WalletConnect', address);
    closeModal();
  } catch (error) {
    if (button) button.textContent = error?.message || 'WalletConnect connection failed';
  }
}

function showWalletModal() {
  if (document.getElementById('vv-wallet-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'vv-wallet-modal';
  modal.innerHTML = `
    <div class="vv-wallet-backdrop">
      <div class="vv-wallet-card" role="dialog" aria-modal="true" aria-label="Choose wallet">
        <button class="vv-wallet-close" aria-label="Close">×</button>
        <div class="vv-wallet-kicker">VOXEL VAULT</div>
        <h2>Connect your wallet</h2>
        <p>Use MetaMask, Coinbase, Trust, Rainbow, Phantom, or any compatible WalletConnect wallet. Your private keys stay inside your wallet.</p>
        <div class="vv-wallet-list"></div>
        <div class="vv-wallet-note">Sepolia test network · Voxel Vault never asks for your seed phrase.</div>
      </div>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    #vv-wallet-modal{position:fixed;inset:0;z-index:99999;font-family:Inter,system-ui,sans-serif}
    .vv-wallet-backdrop{position:absolute;inset:0;display:grid;place-items:center;padding:20px;background:rgba(2,3,8,.78);backdrop-filter:blur(18px)}
    .vv-wallet-card{position:relative;width:min(430px,100%);padding:28px;border:1px solid #302d48;border-radius:20px;background:linear-gradient(145deg,#11131e,#08090f);box-shadow:0 30px 100px rgba(0,0,0,.6)}
    .vv-wallet-close{position:absolute;right:14px;top:10px;border:0;background:transparent;color:#8d93a6;font-size:28px;cursor:pointer}
    .vv-wallet-kicker{font-size:9px;letter-spacing:2.5px;color:#9679ff;font-weight:900}
    .vv-wallet-card h2{margin:9px 0;font-size:28px;color:#fff}
    .vv-wallet-card p{margin:0 0 20px;color:#8f96a9;font-size:12px;line-height:1.6}
    .vv-wallet-list{display:grid;gap:9px}
    .vv-wallet-option{width:100%;padding:14px 15px;border:1px solid #282b3b;border-radius:12px;background:#0d0f17;color:#fff;text-align:left;font-weight:800;cursor:pointer}
    .vv-wallet-option:hover{border-color:#8063ff;background:#151129}
    .vv-wallet-option.primary{border-color:#7658ff;background:linear-gradient(135deg,#24164f,#12101f)}
    .vv-wallet-note{margin-top:16px;text-align:center;color:#666d80;font-size:9px;letter-spacing:.5px;line-height:1.5}
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);

  const list = modal.querySelector('.vv-wallet-list');

  const wcButton = document.createElement('button');
  wcButton.className = 'vv-wallet-option primary';
  wcButton.textContent = '◎ Connect with WalletConnect';
  wcButton.onclick = () => connectWalletConnect(wcButton);
  list.appendChild(wcButton);

  const discovered = [];
  const providers = new Map();
  const announce = (event) => {
    const detail = event.detail;
    const key = detail?.info?.uuid || detail?.info?.name;
    if (!detail?.provider || (key && providers.has(key))) return;
    if (key) providers.set(key, detail.provider);
    discovered.push([detail.info?.name || 'Browser Wallet', detail.provider]);
  };
  window.addEventListener('eip6963:announceProvider', announce);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  setTimeout(() => {
    window.removeEventListener('eip6963:announceProvider', announce);
    discovered.forEach(([name, provider]) => {
      const b = document.createElement('button');
      b.className = 'vv-wallet-option';
      b.textContent = `◈ ${name}`;
      b.onclick = () => connectProvider(provider, name, b);
      list.appendChild(b);
    });

    walletLinks().forEach(([name, href]) => {
      if (discovered.some(([n]) => n.toLowerCase().includes(name.toLowerCase()))) return;
      const b = document.createElement('button');
      b.className = 'vv-wallet-option';
      b.textContent = `↗ Open with ${name}`;
      b.onclick = () => { window.location.href = href; };
      list.appendChild(b);
    });
  }, 250);

  modal.querySelector('.vv-wallet-close').onclick = closeModal;
  modal.querySelector('.vv-wallet-backdrop').onclick = (e) => { if (e.target === e.currentTarget) closeModal(); };
}

export default function WalletBridge() {
  useEffect(() => {
    const onClick = (event) => {
      const target = event.target?.closest?.('button');
      if (!target) return;
      const label = (target.textContent || '').toLowerCase();
      if (!label.includes('metamask') && !label.includes('connect wallet')) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

      const injected = window.ethereum;
      if (injected && !injected.providers) {
        connectProvider(injected, injected.isMetaMask ? 'MetaMask' : 'Browser Wallet', target);
        return;
      }

      showWalletModal();
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

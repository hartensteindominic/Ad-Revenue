'use client';

import { useEffect, useState } from 'react';
import { connectWallet, discoverMetaMaskProvider, getInjectedProvider, getMetaMaskDeepLink, shortenAddress } from '../../lib/wallet-connect';

const STORAGE_KEY = 'voxel-vault-wallet';
const isWalletTrigger = (button) => {
  const text = (button?.textContent || '').toLowerCase();
  return text.includes('connect wallet') || text.includes('connect & start') || text.includes('wallet →');
};

export default function WalletBridge() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    let cancelled = false;
    discoverMetaMaskProvider(450).then((provider) => {
      if (!cancelled) setHasProvider(Boolean(provider));
    });

    const onClick = (event) => {
      const button = event.target?.closest?.('button, a');
      if (!isWalletTrigger(button)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setMessage('');
      setShowPrompt(true);
    };
    document.addEventListener('click', onClick, true);
    return () => { cancelled = true; document.removeEventListener('click', onClick, true); };
  }, []);

  async function handleConnect() {
    setBusy(true);
    setMessage('');
    const result = await connectWallet({ requireSepolia: true });
    if (result.ok) {
      const short = shortenAddress(result.address);
      window.localStorage.setItem(STORAGE_KEY, result.address);
      window.dispatchEvent(new CustomEvent('voxel-vault:wallet', { detail: result }));
      document.querySelectorAll('button, a').forEach((node) => {
        if (isWalletTrigger(node)) node.textContent = short;
      });
      setMessage('Connected.');
      setHasProvider(true);
      setTimeout(() => setShowPrompt(false), 350);
    } else {
      setMessage(result.message || 'Could not connect.');
    }
    setBusy(false);
  }

  if (!showPrompt) return null;
  const deepLink = getMetaMaskDeepLink(window.location.href);

  return (
    <div className="vvWalletOverlay" role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div className="vvWalletCard">
        <button className="vvWalletClose" onClick={() => setShowPrompt(false)} aria-label="Close">×</button>
        <div className="vvWalletOrb">✦</div>
        <div className="vvWalletEyebrow">VAULT KEY</div>
        <h2>Connect to play.</h2>
        <p>Save your collection, claim rewards, and keep your progress with you.</p>
        <button className="vvWalletAction" onClick={handleConnect} disabled={busy}>{busy ? 'Connecting…' : 'Connect wallet'}</button>
        {!hasProvider && <a className="vvWalletLink" href={deepLink}>Open in MetaMask Mobile ↗</a>}
        {message && <div className="vvWalletMessage" role="status">{message}</div>}
        <div className="vvWalletFine">Free to explore. Wallet actions always require your confirmation.</div>
      </div>
      <style jsx>{`
        .vvWalletOverlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(2,3,8,.64);backdrop-filter:blur(14px)}
        .vvWalletCard{position:relative;width:min(360px,100%);padding:28px 22px 20px;border:1px solid rgba(145,115,255,.28);border-radius:22px;background:radial-gradient(circle at 50% 0%,rgba(116,76,255,.12),transparent 44%),#090b12;box-shadow:0 24px 80px rgba(0,0,0,.58);text-align:center}
        .vvWalletClose{position:absolute;right:11px;top:10px;width:30px;height:30px;border:1px solid #252a39;border-radius:50%;background:#10131c;color:#9ba2b7;font-size:19px;cursor:pointer}
        .vvWalletOrb{width:52px;height:52px;margin:0 auto 13px;display:grid;place-items:center;border-radius:17px;border:1px solid rgba(156,124,255,.5);background:linear-gradient(145deg,#7654ed,#9b7cff);font-size:24px;box-shadow:0 0 36px rgba(123,82,255,.25)}
        .vvWalletEyebrow{font-size:8px;letter-spacing:2px;font-weight:900;color:#9b87ff}.vvWalletCard h2{margin:9px 0 8px;color:#fff;font-size:25px;letter-spacing:-.6px}.vvWalletCard p{margin:0 auto 19px;max-width:300px;color:#9198ab;font-size:12px;line-height:1.55}
        .vvWalletAction{width:100%;min-height:46px;border:0;border-radius:12px;background:#8b6cff;color:#fff;font-weight:850;font-size:12px;cursor:pointer;box-shadow:0 10px 28px rgba(111,76,255,.25)}.vvWalletAction:disabled{opacity:.6;cursor:wait}
        .vvWalletLink{display:block;margin-top:12px;color:#aaa1d8;text-decoration:none;font-size:10px}.vvWalletMessage{margin-top:11px;color:#bff2d5;font-size:10px}.vvWalletFine{margin-top:14px;color:#676f82;font-size:9px;line-height:1.4}
      `}</style>
    </div>
  );
}

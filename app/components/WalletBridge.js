'use client';

import { useEffect, useState } from 'react';
import { discoverMetaMaskProvider, getInjectedProvider, getMetaMaskDeepLink } from '../../lib/wallet-connect';

export default function WalletBridge() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    discoverMetaMaskProvider(450).then((provider) => {
      if (!cancelled && provider) setShowPrompt(false);
    });

    const onClick = (event) => {
      const button = event.target?.closest?.('button, a');
      if (!button) return;
      const text = (button.textContent || '').toLowerCase();
      if (!text.includes('metamask') && !text.includes('connect wallet')) return;
      if (getInjectedProvider()) return;

      event.preventDefault();
      setShowPrompt(true);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      cancelled = true;
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  if (!showPrompt) return null;

  const deepLink = getMetaMaskDeepLink(window.location.href);

  return (
    <div className="vvWalletOverlay" role="dialog" aria-modal="true" aria-label="Connect MetaMask">
      <div className="vvWalletCard">
        <button className="vvWalletClose" onClick={() => setShowPrompt(false)} aria-label="Close">×</button>
        <div className="vvWalletOrb">◈</div>
        <div className="vvWalletEyebrow">VOXEL VAULT · WALLET</div>
        <h2>Open this 3D world in MetaMask</h2>
        <p>On iPhone, the easiest path is MetaMask Mobile. Tap below and Voxel Vault will reopen inside your wallet browser.</p>
        <a className="vvWalletAction" href={deepLink}>Open in MetaMask Mobile <span>↗</span></a>
        <button className="vvWalletSecondary" onClick={() => window.location.reload()}>I’m already in MetaMask · Reload</button>
      </div>
      <style jsx>{`
        .vvWalletOverlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:22px;background:rgba(2,3,8,.72);backdrop-filter:blur(18px)}
        .vvWalletCard{position:relative;width:min(430px,100%);padding:34px 28px 28px;border:1px solid rgba(145,115,255,.42);border-radius:24px;background:radial-gradient(circle at 50% 0%,rgba(116,76,255,.2),transparent 42%),#0a0c14;box-shadow:0 30px 100px rgba(0,0,0,.65),0 0 70px rgba(105,72,255,.14);text-align:center}
        .vvWalletClose{position:absolute;right:14px;top:12px;width:34px;height:34px;border:1px solid #272b3d;border-radius:50%;background:#11141f;color:#9ba2b7;font-size:22px;cursor:pointer}
        .vvWalletOrb{width:70px;height:70px;margin:0 auto 18px;display:grid;place-items:center;border-radius:20px;border:1px solid #8063ff;background:linear-gradient(135deg,#6040df,#a981ff);font-size:30px;box-shadow:0 0 50px rgba(123,82,255,.42);transform:rotate(3deg)}
        .vvWalletEyebrow{font-size:9px;letter-spacing:2.4px;font-weight:900;color:#8f76ff}
        .vvWalletCard h2{margin:12px 0 10px;color:#fff;font-size:26px;letter-spacing:-.8px;line-height:1.05}
        .vvWalletCard p{margin:0 auto 22px;max-width:340px;color:#9198ab;font-size:13px;line-height:1.6}
        .vvWalletAction,.vvWalletSecondary{width:100%;min-height:48px;border-radius:12px;font-weight:850;font-size:12px;cursor:pointer}
        .vvWalletAction{display:flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;background:#8967ff;color:#fff;box-shadow:0 12px 35px rgba(111,76,255,.3)}
        .vvWalletSecondary{margin-top:9px;border:1px solid #292d40;background:#11141d;color:#aeb5c8}
      `}</style>
    </div>
  );
}

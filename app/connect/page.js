'use client';

import { useState } from 'react';
import { connectWallet, getMetaMaskDeepLink, shortenAddress } from '../../lib/wallet-connect';

export default function ConnectPage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    setStatus('');
    const result = await connectWallet({ requireSepolia: true });
    if (result.ok) {
      localStorage.setItem('voxel-vault-wallet', result.address);
      window.dispatchEvent(new CustomEvent('voxel-vault:wallet', { detail: result }));
      setStatus(`Connected ${shortenAddress(result.address)}.`);
    } else {
      setStatus(result.message || 'Connection cancelled.');
    }
    setBusy(false);
  }

  const deepLink = typeof window === 'undefined' ? 'https://metamask.io/download/' : getMetaMaskDeepLink(window.location.href);

  return (
    <main className="connect">
      <a className="brand" href="/">V<span>V</span>OXELVAULT</a>
      <section className="card" aria-labelledby="title">
        <div className="orb">✦</div>
        <div className="eyebrow">VAULT KEY</div>
        <h1 id="title">Connect to play.</h1>
        <p>Save your collection, keep your progress, and claim rewards when you discover something special.</p>
        <button type="button" onClick={connect} disabled={busy}>{busy ? 'Connecting…' : 'Connect wallet'}</button>
        <a className="mobile" href={deepLink}>Open in MetaMask Mobile ↗</a>
        <div className="status" role="status">{status}</div>
        <small>Exploring is free. Wallet actions always require your confirmation.</small>
      </section>
      <style jsx>{`
        .connect{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 15%,rgba(126,92,255,.14),transparent 35%),#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.brand{position:fixed;top:24px;left:28px;color:#fff;text-decoration:none;font-size:17px;font-weight:950;letter-spacing:.14em}.brand span{color:#9b7cff}.card{width:min(380px,100%);padding:30px 24px 22px;text-align:center;border:1px solid rgba(255,255,255,.09);border-radius:24px;background:rgba(10,12,20,.9);box-shadow:0 30px 90px rgba(0,0,0,.5)}.orb{width:58px;height:58px;margin:0 auto 14px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,#7654ed,#9b7cff);box-shadow:0 0 38px rgba(123,82,255,.25);font-size:27px}.eyebrow{font-size:8px;letter-spacing:2px;color:#a28cff;font-weight:900}.card h1{margin:9px 0 8px;font-size:29px;letter-spacing:-.7px}.card p{margin:0 auto 20px;max-width:310px;color:#9299ab;font-size:12px;line-height:1.6}.card button{width:100%;min-height:48px;border:0;border-radius:12px;background:#8b6cff;color:#fff;font-weight:850;cursor:pointer}.card button:disabled{opacity:.6;cursor:wait}.mobile{display:block;margin-top:13px;color:#aaa1d8;text-decoration:none;font-size:10px}.status{min-height:18px;margin-top:12px;color:#bff2d5;font-size:10px}.card small{display:block;margin-top:9px;color:#676f82;font-size:9px;line-height:1.4}
      `}</style>
    </main>
  );
}

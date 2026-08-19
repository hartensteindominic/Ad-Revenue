'use client';

import { useEffect, useState } from 'react';

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletConnect() {
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      setAccount(accounts?.[0] || '');
    }).catch(() => {});

    const handleAccountsChanged = (accounts) => setAccount(accounts?.[0] || '');
    ethereum.on?.('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
  }, []);

  async function connect() {
    setNotice('');
    const ethereum = window.ethereum;

    if (!ethereum) {
      setNotice('Open VoxelVault inside MetaMask Mobile to connect your wallet.');
      return;
    }

    setBusy(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts?.[0] || '');
    } catch (error) {
      if (error?.code === 4001) setNotice('Connection cancelled.');
      else setNotice(error?.message || 'Could not connect MetaMask.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="walletConnect">
      <button className="walletButton" onClick={connect} disabled={busy} type="button">
        <span className="foxDot">🦊</span>
        {busy ? 'Connecting…' : account ? shortAddress(account) : 'Connect MetaMask'}
      </button>
      {notice && <span className="walletNotice">{notice}</span>}
      <style jsx>{`
        .walletConnect{position:fixed;top:88px;right:20px;z-index:50;display:flex;flex-direction:column;align-items:flex-end;gap:7px}
        .walletButton{border:1px solid rgba(145,116,255,.55);background:rgba(12,13,22,.92);color:#fff;border-radius:999px;padding:11px 16px;cursor:pointer;font-weight:800;box-shadow:0 8px 30px rgba(0,0,0,.3);backdrop-filter:blur(14px)}
        .walletButton:disabled{opacity:.65;cursor:wait}.foxDot{margin-right:7px}.walletNotice{max-width:270px;padding:9px 12px;border:1px solid #34384b;background:#0c0e16;color:#aeb5c8;border-radius:10px;font-size:11px;line-height:1.4;text-align:right}
        @media(max-width:600px){.walletConnect{top:82px;right:12px}.walletButton{font-size:12px;padding:10px 13px}}
      `}</style>
    </div>
  );
}

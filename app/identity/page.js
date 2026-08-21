'use client';

import { useEffect, useState } from 'react';
import VaultIdentityCard from '../components/VaultIdentityCard';
import { loadVaultIdentity, applyVaultAction, saveVaultIdentity, getVaultSummary } from '../../lib/vault-identity';

export default function IdentityPage() {
  const [address, setAddress] = useState('');
  const [identity, setIdentity] = useState(() => loadVaultIdentity(''));
  const [status, setStatus] = useState('Connect a wallet to bind your Vault Identity.');

  useEffect(() => {
    const sync = () => {
      const next = window.localStorage.getItem('voxel-vault:wallet:last') || '';
      setAddress(next);
      setIdentity(loadVaultIdentity(next));
    };
    sync();
    window.addEventListener('voxel-vault:wallet', sync);
    return () => window.removeEventListener('voxel-vault:wallet', sync);
  }, []);

  const award = (action) => {
    const next = saveVaultIdentity(applyVaultAction(identity, action));
    setIdentity(next);
    setStatus(`${action} recorded locally. Gameplay rewards remain separate from on-chain claims.`);
  };

  const summary = getVaultSummary(identity);

  return (
    <main className="identityPage">
      <nav><a href="/" className="brand">V<span>V</span>OXELVAULT</a><a href="/discover">Atlas</a><a href="/hunt">Hunt</a><a href="/trade">Trade</a></nav>
      <div className="shell">
        <div className="intro">
          <div className="eyebrow">YOUR DIGITAL IDENTITY</div>
          <h1>Your Vault.<br /><em>Your history.</em></h1>
          <p>Your progression, discoveries, missions, travel and collectibles become one evolving identity inside Voxel Vault.</p>
        </div>
        <div className="identityGrid">
          <VaultIdentityCard address={address} />
          <section className="timeline">
            <div className="eyebrow">VAULT TIMELINE</div>
            <h2>{summary.title}</h2>
            <p className="muted">{status}</p>
            <div className="events">
              <div><b>✦ Identity initialized</b><span>{summary.id}</span></div>
              <div><b>⚡ Energy core online</b><span>{summary.energy.toLocaleString()} energy</span></div>
              <div><b>🗺 Discoveries</b><span>{summary.discoveries} mapped</span></div>
              <div><b>🎯 Missions</b><span>{summary.missions} completed</span></div>
            </div>
            <div className="sandbox">
              <span>LOCAL PROGRESSION SANDBOX</span>
              <div className="sandboxButtons">
                <button onClick={() => award('discovery')}>+ Discovery</button>
                <button onClick={() => award('mission')}>+ Mission</button>
                <button onClick={() => award('expedition')}>+ Expedition</button>
              </div>
              <small>These controls demonstrate the identity engine. Production rewards should come from verified activity and explicit claim flows.</small>
            </div>
          </section>
        </div>
      </div>
      <style jsx>{`
        .identityPage{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;position:relative;overflow:hidden}.identityPage:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 78% 12%,rgba(123,87,255,.13),transparent 30%),radial-gradient(circle at 15% 80%,rgba(33,194,255,.07),transparent 25%)}nav{height:76px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:28px;padding:0 5vw;position:relative;z-index:2;background:rgba(5,6,11,.72);backdrop-filter:blur(18px)}nav a{color:#9098ab;text-decoration:none;font-size:12px}nav .brand{margin-right:auto;color:#fff;font-size:17px;font-weight:950;letter-spacing:.14em}.brand span{color:#9c7cff}.shell{max-width:1080px;margin:0 auto;padding:80px 24px 100px;position:relative;z-index:1}.intro{max-width:680px}.eyebrow{font-size:10px;letter-spacing:.2em;font-weight:850;color:#8f97ac}.intro h1{font-size:clamp(48px,8vw,92px);line-height:.94;letter-spacing:-.065em;margin:15px 0 22px}.intro h1 em{font-style:normal;background:linear-gradient(100deg,#fff,#9d83ff 45%,#53d9ff);background-clip:text;color:transparent}.intro p{max-width:600px;color:#9299ab;font-size:16px;line-height:1.65}.identityGrid{display:grid;grid-template-columns:minmax(320px,420px) 1fr;gap:28px;margin-top:58px}.timeline{border:1px solid rgba(255,255,255,.09);border-radius:28px;padding:28px;background:rgba(12,14,23,.75);box-shadow:inset 0 1px rgba(255,255,255,.04)}.timeline h2{font-size:32px;margin:10px 0 5px}.muted{color:#7f879a;font-size:12px;line-height:1.5}.events{margin-top:24px;display:grid;gap:9px}.events div{display:flex;justify-content:space-between;gap:15px;padding:14px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}.events b{font-size:12px}.events span{font-size:10px;color:#777f92;text-align:right}.sandbox{margin-top:28px;padding:17px;border-radius:20px;background:rgba(124,77,255,.06);border:1px solid rgba(124,77,255,.15)}.sandbox>span{font-size:8px;letter-spacing:.16em;color:#9e91c9;font-weight:800}.sandboxButtons{display:flex;gap:8px;flex-wrap:wrap;margin:13px 0}.sandboxButtons button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;border-radius:999px;padding:9px 13px;font-size:11px;cursor:pointer}.sandbox small{display:block;color:#727b90;font-size:9px;line-height:1.5}@media(max-width:760px){nav{gap:15px}.identityGrid{grid-template-columns:1fr}.shell{padding-top:55px}}
      `}</style>
    </main>
  );
}

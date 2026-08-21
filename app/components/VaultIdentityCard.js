'use client';

import { useEffect, useMemo, useState } from 'react';
import { getVaultSummary, loadVaultIdentity, saveVaultIdentity } from '../../lib/vault-identity';

function shortAddress(address) {
  if (!address) return 'UNBOUND';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function VaultIdentityCard({ address = '', compact = false }) {
  const [identity, setIdentity] = useState(() => loadVaultIdentity(address));

  useEffect(() => {
    setIdentity(loadVaultIdentity(address));
  }, [address]);

  const summary = useMemo(() => getVaultSummary(identity), [identity]);

  useEffect(() => {
    if (address) saveVaultIdentity(identity);
  }, [address, identity]);

  return (
    <section className={`vaultIdentityCard ${compact ? 'compact' : ''}`} aria-label="Vault Identity">
      <div className="identityGlow" aria-hidden="true" />
      <div className="identityTop">
        <div>
          <div className="identityEyebrow">VAULT IDENTITY</div>
          <div className="vaultId">{summary.id}</div>
          <div className="identityAddress">{shortAddress(summary.address)}</div>
        </div>
        <div className="identityLevel">
          <span>LEVEL</span>
          <strong>{summary.level}</strong>
        </div>
      </div>

      <div className="identityArtifact" aria-hidden="true">
        <div className="artifactOrbit orbitOne" />
        <div className="artifactOrbit orbitTwo" />
        <div className="artifactCore"><span>✦</span></div>
      </div>

      <div className="identityTitle">
        <strong>{summary.title}</strong>
        <span>{summary.titleDescription}</span>
      </div>

      <div className="identityStats">
        <div><strong>{summary.energy.toLocaleString()}</strong><span>ENERGY</span></div>
        <div><strong>{summary.discoveries.toLocaleString()}</strong><span>DISCOVERIES</span></div>
        <div><strong>{summary.missions.toLocaleString()}</strong><span>MISSIONS</span></div>
        <div><strong>{summary.rare.toLocaleString()}</strong><span>RARE</span></div>
        <div><strong>{summary.mythic.toLocaleString()}</strong><span>MYTHIC</span></div>
        <div><strong>{summary.displayDistance}</strong><span>TRAVEL</span></div>
      </div>

      <div className="identityProgress" aria-label={`${summary.xp} experience points`}>
        <div><span>XP</span><strong>{summary.xp.toLocaleString()}</strong></div>
        <div className="progressTrack"><span style={{ width: `${Math.min(100, (summary.xp % 200) / 2)}%` }} /></div>
      </div>

      <style jsx>{`
        .vaultIdentityCard{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:28px;padding:22px;background:linear-gradient(145deg,rgba(17,20,33,.94),rgba(7,9,16,.97));box-shadow:0 24px 70px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.06);color:#f8f8ff}.identityGlow{position:absolute;width:180px;height:180px;right:-70px;top:-80px;border-radius:50%;background:rgba(126,92,255,.2);filter:blur(45px);pointer-events:none}.identityTop{display:flex;justify-content:space-between;gap:18px;position:relative;z-index:1}.identityEyebrow{font-size:10px;letter-spacing:.18em;color:#9fa6bb;font-weight:800}.vaultId{font-size:19px;font-weight:900;letter-spacing:.05em;margin-top:5px}.identityAddress{font-size:11px;color:#737b91;margin-top:3px}.identityLevel{width:54px;height:54px;border-radius:18px;border:1px solid rgba(151,123,255,.3);background:rgba(124,77,255,.09);display:grid;place-items:center;text-align:center}.identityLevel span{font-size:7px;letter-spacing:.15em;color:#9991bd}.identityLevel strong{font-size:20px;line-height:16px}.identityArtifact{height:150px;position:relative;display:grid;place-items:center}.artifactCore{width:62px;height:62px;border-radius:21px;display:grid;place-items:center;background:linear-gradient(145deg,#9c7cff,#36cfff);box-shadow:0 0 40px rgba(91,159,255,.3);transform:rotate(45deg)}.artifactCore span{font-size:28px;transform:rotate(-45deg);color:#fff}.artifactOrbit{position:absolute;border:1px solid rgba(181,169,255,.24);border-radius:50%;width:125px;height:48px;transform:rotate(-22deg)}.orbitTwo{width:150px;height:60px;transform:rotate(58deg);border-color:rgba(62,210,255,.18)}.identityTitle{display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:15px}.identityTitle strong{font-size:17px}.identityTitle span{font-size:10px;color:#7f879c;text-align:right}.identityStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:15px}.identityStats div{padding:10px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}.identityStats strong{display:block;font-size:15px}.identityStats span{display:block;margin-top:2px;font-size:7px;letter-spacing:.13em;color:#777f94;font-weight:800}.identityProgress{margin-top:14px}.identityProgress>div:first-child{display:flex;justify-content:space-between;font-size:9px;color:#7f879b}.identityProgress strong{color:#dfe3f0}.progressTrack{height:5px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;margin-top:7px}.progressTrack span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#8b6cff,#42d7ff)}.compact{padding:16px;border-radius:22px}.compact .identityArtifact{height:90px}.compact .identityStats{grid-template-columns:repeat(2,1fr)}
        @media(max-width:600px){.identityTitle{display:block}.identityTitle span{display:block;text-align:left;margin-top:4px}.identityStats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </section>
  );
}

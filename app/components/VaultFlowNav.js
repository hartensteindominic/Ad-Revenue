'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { href: '/', label: 'Home', icon: '⌂', description: 'Return to the Vault' },
  { href: '/discover', label: 'Discover', icon: '◈', description: 'Explore collectibles' },
  { href: '/hunt', label: 'Hunt', icon: '⌖', description: 'Find real-world drops' },
  { href: '/marketplace', label: 'Studio', icon: '✦', description: 'Create and publish' },
  { href: '/my-vault', label: 'My Vault', icon: '▣', description: 'Your discoveries' },
];

export default function VaultFlowNav() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState('/');

  useEffect(() => {
    setPath(window.location.pathname || '/');
  }, []);

  return (
    <>
      <nav className="vvFlowNav" aria-label="Voxel Vault navigation">
        <a href="/" className="vvFlowBrand" aria-label="Voxel Vault home">
          <span className="vvFlowMark">VV</span>
          <span>VOXEL VAULT</span>
        </a>
        <div className="vvFlowLinks">
          {STEPS.map((item) => (
            <a key={item.href} href={item.href} className={path === item.href ? 'active' : ''}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </div>
        <button className="vvFlowMenu" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Open navigation">
          {open ? '×' : '☰'}
        </button>
      </nav>
      {open && (
        <div className="vvFlowMobile" role="menu">
          <div className="vvFlowMobileIntro">
            <strong>What do you want to do?</strong>
            <span>Voxel Vault is built as a flow: discover → hunt → own → create.</span>
          </div>
          {STEPS.map((item, index) => (
            <a key={item.href} href={item.href} role="menuitem" className={path === item.href ? 'active' : ''}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <span className="vvFlowIcon">{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="vvFlowArrow">→</span>
            </a>
          ))}
        </div>
      )}
      <style jsx>{`
        .vvFlowNav{position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:space-between;min-height:70px;padding:0 clamp(16px,5vw,72px);background:rgba(5,6,11,.9);border-bottom:1px solid rgba(255,255,255,.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
        .vvFlowBrand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:.16em;white-space:nowrap}.vvFlowMark{display:grid;place-items:center;width:31px;height:31px;border-radius:9px;background:linear-gradient(135deg,#8b5cf6,#5b21b6);box-shadow:0 0 24px rgba(139,92,246,.35);font-size:10px;letter-spacing:-.04em}
        .vvFlowLinks{display:flex;align-items:center;gap:4px}.vvFlowLinks a{display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;color:#9da3b5;text-decoration:none;font-size:12px;font-weight:750;transition:.18s}.vvFlowLinks a:hover,.vvFlowLinks a.active{color:#fff;background:rgba(139,92,246,.12);box-shadow:inset 0 0 0 1px rgba(139,92,246,.2)}.vvFlowLinks a.active{color:#c4b5fd}
        .vvFlowMenu{display:none;border:1px solid rgba(255,255,255,.14);background:#0b0d15;color:#fff;border-radius:12px;width:40px;height:40px;font-size:20px;cursor:pointer}
        .vvFlowMobile{position:fixed;top:70px;left:12px;right:12px;z-index:79;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:rgba(8,9,16,.97);box-shadow:0 24px 70px rgba(0,0,0,.55);backdrop-filter:blur(20px)}.vvFlowMobileIntro{padding:10px 12px 14px;border-bottom:1px solid rgba(255,255,255,.08);display:grid;gap:4px}.vvFlowMobileIntro strong{font-size:15px}.vvFlowMobileIntro span{font-size:11px;color:#8e95aa}.vvFlowMobile a{display:grid;grid-template-columns:30px 28px 1fr 20px;align-items:center;gap:9px;padding:13px 10px;color:#fff;text-decoration:none;border-radius:14px}.vvFlowMobile a.active,.vvFlowMobile a:hover{background:rgba(139,92,246,.1)}.vvFlowMobile a>b{font-size:10px;color:#62697a}.vvFlowIcon{font-size:18px;color:#a78bfa}.vvFlowMobile small{display:block;margin-top:2px;color:#81899d;font-size:10px}.vvFlowArrow{color:#7c8498}
        @media(max-width:900px){.vvFlowLinks{display:none}.vvFlowMenu{display:block}}
        @media(min-width:901px){.vvFlowMobile{display:none}}
      `}</style>
    </>
  );
}

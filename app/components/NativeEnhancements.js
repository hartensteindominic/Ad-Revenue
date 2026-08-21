'use client';

import { useEffect, useState } from 'react';
import {
  getSavedVaultItems,
  isNativeApp,
  saveCurrentCollectible,
  shareCurrentCollectible,
  tapHaptic,
} from '../../lib/native';

export default function NativeEnhancements() {
  const [native, setNative] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setNative(isNativeApp());

    getSavedVaultItems().then((items) => {
      if (mounted) setSavedCount(items.length);
    }).catch(() => {});

    const onClick = (event) => {
      const target = event.target?.closest?.('button, a');
      if (!target || target.hasAttribute('disabled')) return;
      void tapHaptic();
    };

    document.addEventListener('click', onClick, { passive: true });
    return () => {
      mounted = false;
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (!native) return null;

  async function savePage() {
    const ok = await saveCurrentCollectible({
      title: document.title || 'Voxel Vault collectible',
      url: window.location.href,
      description: 'Saved from the Voxel Vault iPhone app.',
    });
    if (ok) {
      setSavedCount((count) => Math.min(50, count + 1));
      setMessage('Saved to My Vault');
      window.setTimeout(() => setMessage(''), 1800);
    }
  }

  async function sharePage() {
    const ok = await shareCurrentCollectible({
      title: document.title || 'Voxel Vault',
      text: 'Explore this 3D collectible in Voxel Vault.',
      url: window.location.href,
    });
    if (!ok) {
      setMessage('Share unavailable');
      window.setTimeout(() => setMessage(''), 1800);
    }
  }

  return (
    <>
      <div className="vvNativeTools" aria-label="Voxel Vault native tools">
        <a href="/my-vault" className="vvNativeVault" aria-label={`Open My Vault, ${savedCount} saved`}>
          ◈ <span>My Vault</span>{savedCount > 0 ? <b>{savedCount}</b> : null}
        </a>
        <button onClick={savePage} aria-label="Save this collectible to My Vault">＋ Save</button>
        <button onClick={sharePage} aria-label="Share this collectible">↗ Share</button>
      </div>
      {message ? <div className="vvNativeToast" role="status">{message}</div> : null}
      <style jsx>{`
        .vvNativeTools{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9000;display:flex;align-items:center;gap:6px;padding:6px;border:1px solid rgba(145,115,255,.28);border-radius:18px;background:rgba(7,8,15,.88);box-shadow:0 16px 50px rgba(0,0,0,.5),0 0 35px rgba(109,77,255,.12);backdrop-filter:blur(18px)}
        .vvNativeTools button,.vvNativeVault{min-height:40px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:#cdd1df;text-decoration:none;font-size:11px;font-weight:850;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .vvNativeTools button:active,.vvNativeVault:active{background:#171a27}
        .vvNativeVault{color:#fff;background:linear-gradient(135deg,rgba(123,86,255,.24),rgba(123,86,255,.08))}
        .vvNativeVault b{min-width:18px;height:18px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#8c6bff;color:#fff;font-size:9px}
        .vvNativeToast{position:fixed;left:50%;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 62px);transform:translateX(-50%);z-index:9001;padding:9px 13px;border:1px solid #34384d;border-radius:999px;background:#11131d;color:#f5f6ff;font-size:11px;font-weight:800;box-shadow:0 12px 35px rgba(0,0,0,.42)}
        @media(min-width:768px){.vvNativeTools,.vvNativeToast{display:none}}
      `}</style>
    </>
  );
}

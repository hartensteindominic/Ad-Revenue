'use client';

import { useEffect } from 'react';

function getMetaMaskDeepLink() {
  if (typeof window === 'undefined') return '';
  const clean = window.location.href.replace(/^https?:\/\//, '');
  return `https://metamask.app.link/dapp/${clean}`;
}

export default function WalletBridge() {
  useEffect(() => {
    const onClick = (event) => {
      const target = event.target?.closest?.('button');
      if (!target) return;
      const label = (target.textContent || '').toLowerCase();
      if (!label.includes('metamask')) return;
      if (window.ethereum) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

      const link = getMetaMaskDeepLink();
      if (link) window.location.href = link;
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

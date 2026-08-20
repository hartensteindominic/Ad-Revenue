'use client';

import { useEffect } from 'react';
import { getInjectedProvider, getMetaMaskDeepLink } from '../../lib/wallet-connect';

export default function WalletBridge() {
  useEffect(() => {
    const onClick = (event) => {
      const button = event.target?.closest?.('button, a');
      if (!button) return;
      const text = (button.textContent || '').toLowerCase();
      if (!text.includes('metamask') && !text.includes('connect wallet')) return;
      if (getInjectedProvider()) return;
      const deepLink = getMetaMaskDeepLink(window.location.href);
      event.preventDefault();
      window.location.href = deepLink;
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

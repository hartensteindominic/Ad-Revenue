'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WalletContext = createContext(null);
const STORAGE_KEY = 'voxel-vault-wallet';

export function WalletIdentityProvider({ children }) {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('');
  const [connected, setConnected] = useState(false);

  const sync = useCallback(async () => {
    const provider = window.ethereum;
    if (!provider) return;
    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      const chain = await provider.request({ method: 'eth_chainId' });
      const next = accounts?.[0] || '';
      setAddress(next);
      setConnected(Boolean(next));
      setChainId(chain || '');
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      setAddress('');
      setConnected(false);
      setChainId('');
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = window.ethereum;
    if (!provider) throw new Error('MetaMask was not detected. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    await sync();
    return accounts?.[0] || '';
  }, [sync]);

  const disconnect = useCallback(() => {
    setAddress('');
    setConnected(false);
    setChainId('');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return undefined;
    sync();
    const handleAccounts = () => sync();
    const handleChain = () => sync();
    provider.on?.('accountsChanged', handleAccounts);
    provider.on?.('chainChanged', handleChain);
    return () => {
      provider.removeListener?.('accountsChanged', handleAccounts);
      provider.removeListener?.('chainChanged', handleChain);
    };
  }, [sync]);

  const value = useMemo(() => ({ address, connected, chainId, connect, disconnect, refresh: sync }), [address, connected, chainId, connect, disconnect, sync]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletIdentity() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWalletIdentity must be used inside WalletIdentityProvider');
  return context;
}

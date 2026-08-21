'use client';

import React, { useState } from 'react';

export default function PremiumMarketplace({ selected, wallet, onConnect, hasContracts, buyAsset }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function buyCard() {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    setStatus(`Opening secure checkout for ${selected.name}…`);
    try {
      const response = await fetch('/api/checkout-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetId: String(selected.id),
          priceUsd: Number(selected.priceUsd),
          name: selected.name,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || 'Unable to start secure checkout.');
      if (!data?.url) throw new Error('Checkout session was created without a checkout URL.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err?.message || 'Card checkout failed.');
      setStatus('');
      setBusy(false);
    }
  }

  async function buyCrypto() {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    setStatus(`Preparing ETH purchase for ${selected.name}…`);
    try {
      if (!hasContracts) throw new Error('Live marketplace contracts are not configured yet.');
      if (typeof buyAsset !== 'function') throw new Error('Marketplace purchase is not available yet.');
      await buyAsset(selected.id, selected.price);
      setStatus('Transaction submitted. Waiting for confirmation…');
    } catch (err) {
      setError(err?.message || 'ETH purchase failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="premiumMarket" id="marketplace">
      <div className="marketShell">
        <div className="marketTopline">
          <div className="marketKicker"><span /> THE VAULT MARKETPLACE <b>SEPOLIA</b></div>
          <button className="connectButton" type="button" onClick={onConnect}>
            {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect MetaMask'}
          </button>
        </div>

        {selected ? (
          <div className="marketPurchasePanel">
            <div>
              <div className="marketKicker">DISCOVER · COLLECT · CREATE</div>
              <h2>{selected.name}</h2>
              <p>Own this 3D collectible with ETH or purchase the creator entitlement with a regular card.</p>
              {status && <p role="status" aria-live="polite">{status}</p>}
              {error && <p role="alert">{error}</p>}
            </div>
            <div className="marketActions">
              <button type="button" disabled={busy} onClick={buyCrypto}>
                {busy ? 'Working…' : `Buy with ${selected.price} ETH`}
              </button>
              <button type="button" disabled={busy} onClick={buyCard}>
                {busy ? 'Working…' : `Pay $${selected.priceUsd} by card`}
              </button>
            </div>
          </div>
        ) : (
          <div className="marketPurchasePanel"><h2>Select a collectible</h2><p>Choose an object to inspect its real purchase options.</p></div>
        )}
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createTradeOffer, canAcceptTrade, transitionTrade, isTradeExpired } from '../../lib/tradingEngine';
import { createUniversalCollectible, collectibleFingerprint } from '../../lib/universalCollectible';

const DEMO_OBJECTS = [
  createUniversalCollectible({ name: 'Field Camera', family: 'technology', subtype: 'camera', rarity: 'rare', seed: 'camera-001' }),
  createUniversalCollectible({ name: 'Survey Robot', family: 'technology', subtype: 'robot', rarity: 'epic', seed: 'robot-001' }),
  createUniversalCollectible({ name: 'Street Deck', family: 'sports', subtype: 'skateboard', rarity: 'uncommon', seed: 'board-001' }),
];

function makeQrDataUrl(text) {
  const size = 140;
  const cells = 21;
  const cell = size / cells;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="#0b0d15"/>`;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const bit = ((hash ^ (x * 17 + y * 31)) + x * y) & 1;
      const finder = (x < 7 && y < 7) || (x > cells - 8 && y < 7) || (x < 7 && y > cells - 8);
      if (bit || finder) {
        svg += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${finder ? '#55e6ff' : '#e7e2ff'}"/>`;
      }
    }
  }
  svg += `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function TapToTrade({ initialOfferId = '', mode = 'create' }) {
  const [wallet, setWallet] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedOffered, setSelectedOffered] = useState([DEMO_OBJECTS[0].name]);
  const [status, setStatus] = useState(
    mode === 'accept' && initialOfferId
      ? `Opened offer ${initialOfferId}. Connect wallet and accept.`
      : ''
  );
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(false);

  const deepLink = useMemo(() => {
    if (!offer) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://voxel-vault.vercel.app';
    return `${base}/trade?mode=accept&offer=${encodeURIComponent(offer.id || 'local')}`;
  }, [offer]);

  const qrUrl = useMemo(() => (deepLink ? makeQrDataUrl(deepLink) : ''), [deepLink]);

  async function connectWallet() {
    try {
      if (typeof window === 'undefined' || !window.ethereum) throw new Error('Wallet not detected');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts?.[0] || '');
      setStatus(accounts?.[0] ? `Connected ${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}` : 'Cancelled');
    } catch (e) {
      setStatus(e?.message || 'Wallet failed');
    }
  }

  function createOffer() {
    if (!wallet) {
      setStatus('Connect your wallet first');
      return;
    }
    if (!selectedOffered.length) {
      setStatus('Select at least one object to offer');
      return;
    }
    try {
      const offered = DEMO_OBJECTS.filter((o) => selectedOffered.includes(o.name)).map((o) => ({
        type: 'collectible',
        name: o.name,
        fingerprint: collectibleFingerprint(o),
        family: o.family,
        rarity: o.rarity,
      }));
      const trade = createTradeOffer({
        offerer: wallet,
        recipient: recipient.trim() || '0x000000000000000000000000000000000000dEaD',
        offered,
        requested: [],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      trade.id = `trade-${Date.now().toString(36)}`;
      setOffer(trade);
      try {
        window.localStorage.setItem(`voxel-vault-trade-${trade.id}`, JSON.stringify(trade));
      } catch {
        // ignore
      }
      setStatus('Trade offer created. Show the QR or share the link. Both wallets must approve before settlement.');
    } catch (e) {
      setStatus(e?.message || 'Could not create offer');
    }
  }

  function acceptOffer() {
    if (!wallet) {
      setStatus('Connect wallet first');
      return;
    }
    if (!offer) {
      setStatus('Create or load an offer first');
      return;
    }
    setBusy(true);
    try {
      const working = {
        ...offer,
        recipient:
          offer.recipient === '0x000000000000000000000000000000000000dead'
            ? wallet.toLowerCase()
            : offer.recipient,
      };
      if (!canAcceptTrade(working, wallet)) {
        throw new Error('This wallet cannot accept this offer (wrong recipient or expired)');
      }
      const accepted = transitionTrade(working, 'accepted');
      const submitted = transitionTrade(accepted, 'submitted');
      setOffer(submitted);
      setStatus('Offer accepted & submitted. Confirm the transaction in your wallet. Ownership changes only after chain confirmation.');
    } catch (e) {
      setStatus(e?.message || 'Accept failed');
    } finally {
      setBusy(false);
    }
  }

  function confirmOnChain() {
    if (!offer) return;
    try {
      const confirmed = transitionTrade(offer, 'confirmed');
      setOffer(confirmed);
      setStatus('Marked confirmed (demo). In production this step is driven by the actual transaction receipt.');
    } catch (e) {
      setStatus(e?.message || 'Confirm failed');
    }
  }

  return (
    <main className="tradeRoot">
      <nav className="tradeNav">
        <Link className="brand" href="/">V<span>V</span>OXELVAULT</Link>
        <div className="navLinks">
          <Link href="/">Gallery</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/trade" className="active">Trade</Link>
          <Link href="/marketplace">Marketplace</Link>
        </div>
        <button type="button" className="walletBtn" onClick={connectWallet}>
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect Wallet'}
        </button>
      </nav>

      <header className="tradeHero">
        <div className="eyebrow"><i /> TAP TO TRADE · DUAL APPROVAL</div>
        <h1>Trade like <em>passing a card.</em></h1>
        <p>
          Pick what you want to offer, generate a QR / deep link, and let the other person accept on their phone.
          Both wallets approve. The blockchain settles ownership. No seed phrases. No automatic transfers.
        </p>
      </header>

      <section className="tradeGrid">
        <div className="panel">
          <h3>1. Choose objects to offer</h3>
          <div className="objectList">
            {DEMO_OBJECTS.map((obj) => {
              const checked = selectedOffered.includes(obj.name);
              return (
                <label key={obj.name} className={`obj ${checked ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedOffered((prev) =>
                        checked ? prev.filter((n) => n !== obj.name) : [...prev, obj.name]
                      );
                    }}
                  />
                  <div>
                    <strong>{obj.name}</strong>
                    <span>{obj.family} · {obj.rarity}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <label className="field">
            Recipient wallet (optional if using QR)
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x… or leave blank for open QR handoff"
            />
          </label>

          <button type="button" className="primary" onClick={createOffer} disabled={!wallet || !selectedOffered.length}>
            Create trade offer
          </button>
        </div>

        <div className="panel handoff">
          <h3>2. Show this to the other phone</h3>
          {offer ? (
            <>
              <div className="qrWrap">
                {qrUrl && <img src={qrUrl} alt="Trade handoff code" width={160} height={160} />}
                <div className="offerState">State: <b>{offer.state}</b></div>
              </div>
              <p className="linkLabel">Deep link</p>
              <code className="deeplink">{deepLink}</code>
              <p className="hint">
                Recipient opens the link, connects their wallet, and taps Accept.
                Both sides must approve before the trade is submitted on-chain.
              </p>
              <div className="actions">
                <button type="button" className="secondary" onClick={acceptOffer} disabled={busy || !wallet}>
                  {busy ? 'Working…' : 'Accept as recipient'}
                </button>
                {offer.state === 'submitted' && (
                  <button type="button" className="primary" onClick={confirmOnChain}>Mark confirmed (demo)</button>
                )}
              </div>
              {isTradeExpired(offer) && <p className="expired">This offer has expired.</p>}
            </>
          ) : (
            <div className="emptyHandoff">
              <p>Create an offer to generate a QR and deep link for phone-to-phone handoff.</p>
            </div>
          )}
        </div>
      </section>

      {status && (
        <div className="statusBar">
          <span>●</span>{status}
          <button type="button" onClick={() => setStatus('')}>×</button>
        </div>
      )}

      <style jsx>{`
        .tradeRoot{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .tradeNav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:40}
        .brand{font-size:16px;font-weight:950;letter-spacing:.14em;text-decoration:none;color:#fff}.brand span{color:#9b7cff}
        .navLinks{display:flex;gap:22px;font-size:13px}.navLinks a{color:#9da3b5;text-decoration:none}.navLinks a.active,.navLinks a:hover{color:#fff}
        .walletBtn{border:1px solid rgba(255,255,255,.14);background:#0b0d15;border-radius:999px;padding:10px 14px;color:#fff;font-weight:800;cursor:pointer}
        .tradeHero{max-width:900px;margin:0 auto;padding:48px 5vw 20px}
        .eyebrow{font-size:10px;letter-spacing:.18em;color:#8e95aa;font-weight:850;margin-bottom:12px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}
        .tradeHero h1{font-size:clamp(40px,6vw,72px);line-height:.92;letter-spacing:-.05em;margin:0 0 14px;font-weight:950}
        .tradeHero h1 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}
        .tradeHero p{color:#a7adbe;line-height:1.65;font-size:15px}
        .tradeGrid{max-width:1100px;margin:0 auto;padding:20px 5vw 80px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .panel{border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:22px;background:rgba(8,10,17,.95)}
        .panel h3{margin:0 0 16px;font-size:16px}
        .objectList{display:grid;gap:8px;margin-bottom:16px}
        .obj{display:flex;gap:12px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;cursor:pointer}
        .obj.on{border-color:rgba(155,124,255,.45);background:rgba(155,124,255,.08)}
        .obj strong{display:block}.obj span{font-size:11px;color:#7f879b;text-transform:capitalize}
        .field{display:grid;gap:6px;font-size:11px;letter-spacing:.08em;color:#8f97ad;margin-bottom:14px}
        .field input{background:#090b12;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:11px;color:#fff}
        .primary,.secondary{border-radius:999px;padding:12px 18px;font-weight:850;cursor:pointer;border:1px solid transparent}
        .primary{background:#fff;color:#07080c;border-color:#fff;width:100%}.secondary{background:#0b0d15;color:#e7e2ff;border-color:rgba(155,124,255,.35)}
        .handoff{display:flex;flex-direction:column;align-items:center;text-align:center}
        .qrWrap{padding:16px;border-radius:18px;background:#090b12;border:1px solid rgba(255,255,255,.08);margin-bottom:12px}
        .offerState{margin-top:8px;font-size:12px;color:#9da3b5}.offerState b{color:#55e6ff;text-transform:uppercase}
        .linkLabel{font-size:10px;letter-spacing:.14em;color:#7f879b;margin:8px 0 4px}
        .deeplink{display:block;font-size:10px;word-break:break-all;color:#a183ff;max-width:100%;padding:8px;background:rgba(0,0,0,.3);border-radius:8px}
        .hint{font-size:12px;color:#8a91a5;line-height:1.5;margin:12px 0}
        .actions{display:flex;gap:8px;width:100%;flex-wrap:wrap;justify-content:center}.actions button{flex:1;min-width:140px}
        .emptyHandoff{padding:40px 20px;color:#7f879b}
        .expired{color:#ff8f8f;font-size:13px}
        .statusBar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:80;background:#11141e;border:1px solid rgba(255,255,255,.14);padding:11px 14px;border-radius:999px;display:flex;align-items:center;gap:9px;font-size:12px;max-width:min(920px,94vw)}.statusBar span{color:#9b7cff}.statusBar button{border:0;background:transparent;color:#8e94a7;cursor:pointer}
        @media(max-width:800px){.tradeGrid{grid-template-columns:1fr}.navLinks{display:none}}
      `}</style>
    </main>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createUniversalCollectible } from '../../lib/universalCollectible';
import { mintClaimOnEthereum } from '../../lib/claimMint';
import { hasNftContract, EVM_CHAIN_NAME } from '../../lib/blockchain';
import { evaluateHuntProgress } from '../../lib/scavengerHunt';

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function progressKey(huntId, wallet) {
  return `vv-hunt-progress:${huntId}:${String(wallet || 'anon').toLowerCase()}`;
}

function loadLocalProgress(huntId, wallet) {
  if (typeof window === 'undefined' || !wallet) return null;
  try {
    const raw = window.localStorage.getItem(progressKey(huntId, wallet));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProgress(huntId, wallet, data) {
  if (typeof window === 'undefined' || !wallet) return;
  try {
    window.localStorage.setItem(progressKey(huntId, wallet), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export default function ScavengerHuntExperience() {
  const [hunts, setHunts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [wallet, setWallet] = useState('');
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeStopId, setActiveStopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localCompleted, setLocalCompleted] = useState([]);

  const loadHunts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hunts');
      const data = await res.json();
      if (res.ok) {
        setHunts(data.hunts || []);
        if (!selectedId && data.hunts?.[0]) setSelectedId(data.hunts[0].id);
      } else {
        setStatus(data.error || 'Failed to load hunts');
      }
    } catch (e) {
      setStatus(e?.message || 'Failed to load hunts');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadDetail = useCallback(async (huntId, walletAddress) => {
    if (!huntId) return;
    const q = new URLSearchParams({ id: huntId });
    if (walletAddress) q.set('wallet', walletAddress);
    const res = await fetch(`/api/hunts?${q}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load hunt');

    // Merge server progress with localStorage (survives cold starts)
    const local = loadLocalProgress(huntId, walletAddress);
    const serverIds = data.progress?.completedStopIds || [];
    const localIds = local?.completedStopIds || [];
    const merged = [...new Set([...serverIds, ...localIds])];
    setLocalCompleted(merged);

    if (data.hunt && merged.length) {
      data.evaluation = evaluateHuntProgress(data.hunt, merged);
      data.progress = {
        ...(data.progress || {}),
        completedStopIds: merged,
        rewardMinted: data.progress?.rewardMinted || local?.rewardMinted || false,
        rewardTxHash: data.progress?.rewardTxHash || local?.rewardTxHash || null,
      };
    }
    setDetail(data);
  }, []);

  useEffect(() => { loadHunts(); }, [loadHunts]);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId, wallet).catch((e) => setStatus(e.message));
    }
  }, [selectedId, wallet, loadDetail]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error('Wallet not detected — open in MetaMask Mobile');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts?.[0] || '');
      setStatus(accounts?.[0] ? `Connected ${accounts[0].slice(0, 6)}… · ${EVM_CHAIN_NAME}` : 'Cancelled');
    } catch (e) {
      setStatus(e?.message || 'Wallet failed');
    }
  }

  const hunt = detail?.hunt;
  const evaluation = detail?.evaluation || (hunt ? evaluateHuntProgress(hunt, localCompleted) : null);
  const progress = detail?.progress;

  const stopsWithDistance = useMemo(() => {
    if (!hunt?.stops) return [];
    return hunt.stops
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stop) => {
        const dist =
          position && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)
            ? haversineMeters(position.lat, position.lng, stop.lat, stop.lng)
            : null;
        const done = (evaluation?.completedStopIds || localCompleted).includes(stop.id);
        const locked = (evaluation?.lockedStops || []).includes(stop.id);
        const isNext = evaluation?.nextStop?.id === stop.id;
        return { ...stop, dist, done, locked, isNext };
      });
  }, [hunt, position, evaluation, localCompleted]);

  const mapCenter = useMemo(() => {
    if (position) return position;
    const withCoords = stopsWithDistance.filter((s) => Number.isFinite(s.lat));
    if (!withCoords.length) return { lat: 40.75, lng: -73.98 };
    const lat = withCoords.reduce((a, s) => a + s.lat, 0) / withCoords.length;
    const lng = withCoords.reduce((a, s) => a + s.lng, 0) / withCoords.length;
    return { lat, lng };
  }, [position, stopsWithDistance]);

  function project(lat, lng) {
    const scale = 12000;
    const x = 50 + (lng - mapCenter.lng) * scale;
    const y = 50 - (lat - mapCenter.lat) * scale;
    return { x: Math.max(6, Math.min(94, x)), y: Math.max(6, Math.min(94, y)) };
  }

  async function claimDropForStop(stop) {
    if (!wallet) { setStatus('Connect wallet first'); return; }
    if (!stop.dropId) { setStatus('This stop has no linked drop'); return; }
    setBusy(true);
    setActiveStopId(stop.id);
    try {
      const claimRes = await fetch('/api/drops/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropId: stop.dropId,
          walletAddress: wallet,
          distanceMeters: stop.dist,
          requireInZone: false,
        }),
      });
      const claimData = await claimRes.json().catch(() => ({}));

      // New claim OR reuse existing ticket (already_claimed)
      let ticket = claimData.claimTicket;
      if (!claimRes.ok && claimRes.status === 409 && claimData.claimTicket) {
        ticket = claimData.claimTicket;
        setStatus('Reusing your existing claim ticket for this drop…');
      } else if (!claimRes.ok && !ticket) {
        // Demo fallback: synthesize a local ticket so the hunt remains playable
        ticket = `demo_${stop.dropId}_${wallet.slice(2, 10)}`;
        setStatus('Server claim unavailable — clearing stop in demo mode.');
      } else if (!claimRes.ok) {
        throw new Error(claimData.error || 'Drop claim failed');
      }

      if (hasNftContract() && claimData.collectible && claimRes.ok) {
        setStatus(`Minting stop NFT on ${EVM_CHAIN_NAME} (ETH gas)…`);
        try {
          await mintClaimOnEthereum({
            collectible: claimData.collectible,
            claimTicket: ticket,
            dropId: stop.dropId,
          });
        } catch (mintErr) {
          console.warn('Stop mint skipped', mintErr);
        }
      }

      const progRes = await fetch('/api/hunts/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_stop',
          huntId: hunt.id,
          walletAddress: wallet,
          stopId: stop.id,
          claimTicket: ticket,
        }),
      });
      const progData = await progRes.json().catch(() => ({}));

      // Always update local progress so UI advances even if server memory is cold
      const nextIds = [...new Set([...(localCompleted || []), stop.id])];
      setLocalCompleted(nextIds);
      saveLocalProgress(hunt.id, wallet, {
        completedStopIds: nextIds,
        rewardMinted: false,
      });

      if (!progRes.ok && progRes.status !== 409) {
        // Local progress still saved
        setStatus(progData.error || 'Stop saved locally (server progress may reset on cold start)');
      } else {
        setStatus(progData.message || 'Stop cleared');
      }

      await loadDetail(hunt.id, wallet);
    } catch (e) {
      setStatus(e?.shortMessage || e?.message || 'Stop failed');
    } finally {
      setBusy(false);
      setActiveStopId(null);
    }
  }

  async function mintHuntReward() {
    if (!wallet || !hunt) return;
    const evalNow = evaluation || evaluateHuntProgress(hunt, localCompleted);
    if (!evalNow?.complete) { setStatus('Finish all required stops first'); return; }

    if (!hasNftContract()) {
      // Demo completion without chain
      saveLocalProgress(hunt.id, wallet, {
        completedStopIds: localCompleted,
        rewardMinted: true,
        rewardTxHash: 'demo-local',
      });
      setStatus(`Hunt complete (demo). Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS to mint on ${EVM_CHAIN_NAME}.`);
      await loadDetail(hunt.id, wallet);
      return;
    }

    setBusy(true);
    try {
      const collectible = createUniversalCollectible({
        name: hunt.reward?.name || `${hunt.name} Badge`,
        family: hunt.reward?.family || 'artifacts',
        subtype: hunt.reward?.subtype || 'badge',
        rarity: hunt.reward?.rarity || 'epic',
        seed: `${hunt.id}-reward`,
        description: hunt.reward?.description,
        realityBasis: { inspiredBy: 'scavenger hunt completion badge', plausibility: 'stylized' },
      });
      setStatus(`Minting hunt reward on ${EVM_CHAIN_NAME}…`);
      const minted = await mintClaimOnEthereum({
        collectible,
        claimTicket: `hunt-complete-${hunt.id}-${wallet.slice(2, 10)}`,
        dropId: hunt.id,
      });
      await fetch('/api/hunts/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_reward_minted',
          huntId: hunt.id,
          walletAddress: wallet,
          txHash: minted.hash,
        }),
      });
      saveLocalProgress(hunt.id, wallet, {
        completedStopIds: localCompleted,
        rewardMinted: true,
        rewardTxHash: minted.hash,
      });
      await loadDetail(hunt.id, wallet);
      setStatus(minted.message || `Reward minted. ${minted.explorerTx || ''}`);
    } catch (e) {
      setStatus(e?.shortMessage || e?.message || 'Reward mint failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="huntRoot">
      <nav className="huntNav">
        <Link className="brand" href="/">V<span>V</span>OXELVAULT</Link>
        <div className="navLinks">
          <Link href="/">Gallery</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/hunt" className="active">Hunt</Link>
          <Link href="/trade">Trade</Link>
          <Link href="/marketplace">Marketplace</Link>
        </div>
        <button type="button" className="walletBtn" onClick={connectWallet}>
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '◈ Connect Wallet'}
        </button>
      </nav>

      <header className="huntHero">
        <div className="eyebrow"><i /> SCAVENGER JOBS · 3D NFT TRAILS · {EVM_CHAIN_NAME}</div>
        <h1>Hunt them <em>down.</em></h1>
        <p>
          Multi-stop jobs across public zones. Clear each stop, finish the trail,
          mint a completion badge with <strong>ETH</strong> gas when contracts are set.
        </p>
      </header>

      <section className="huntLayout">
        <aside className="huntList">
          <h3>Open jobs {loading ? '…' : `(${hunts.length})`}</h3>
          {!loading && !hunts.length && <p className="empty">No hunts available</p>}
          {hunts.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`huntCard ${selectedId === h.id ? 'on' : ''}`}
              onClick={() => setSelectedId(h.id)}
            >
              <strong>{h.name}</strong>
              <span>
                {h.mode} · {h.stopCount || h.stops?.length || 0} stops
                {h.difficulty ? ` · ${h.difficulty}` : ''}
                {h.active ? ' · LIVE' : ' · OFF'}
              </span>
              <p>{h.description}</p>
              {h.estimatedMinutes ? <em>~{h.estimatedMinutes} min</em> : null}
            </button>
          ))}
        </aside>

        <div className="huntDetail">
          {hunt ? (
            <>
              <div className="detailHead">
                <div>
                  <div className="eyebrow">{hunt.mode?.toUpperCase()} · {hunt.difficulty || 'STANDARD'}</div>
                  <h2>{hunt.name}</h2>
                  <p>{hunt.description}</p>
                </div>
                <div className="progressRing">
                  <b>{evaluation?.percent ?? 0}%</b>
                  <span>{evaluation?.completedRequired ?? 0}/{evaluation?.totalRequired ?? 0}</span>
                </div>
              </div>

              <div className="bar"><i style={{ width: `${evaluation?.percent ?? 0}%` }} /></div>

              <div className="miniMap" aria-label="Hunt map">
                {stopsWithDistance.map((s) => {
                  if (!Number.isFinite(s.lat)) return null;
                  const { x, y } = project(s.lat, s.lng);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`mPin ${s.done ? 'done' : ''} ${s.isNext ? 'next' : ''} ${s.locked ? 'locked' : ''}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      title={s.title}
                      onClick={() => !s.locked && !s.done && claimDropForStop(s)}
                    >
                      <span />
                    </button>
                  );
                })}
                {position && (() => {
                  const { x, y } = project(position.lat, position.lng);
                  return <div className="you" style={{ left: `${x}%`, top: `${y}%` }} />;
                })()}
              </div>

              <div className="stopList">
                {stopsWithDistance.map((stop) => (
                  <article key={stop.id} className={`stop ${stop.done ? 'done' : ''} ${stop.locked ? 'locked' : ''} ${stop.isNext ? 'next' : ''}`}>
                    <div className="stopTop">
                      <span className="ord">#{stop.order}</span>
                      <strong>{stop.title}</strong>
                      {stop.done && <span className="tag">CLEARED</span>}
                      {stop.isNext && !stop.done && <span className="tag nextTag">NEXT</span>}
                      {stop.locked && <span className="tag lockTag">LOCKED</span>}
                    </div>
                    {stop.clue && <p className="clue">“{stop.clue}”</p>}
                    <div className="stopMeta">
                      <span>{stop.dist != null ? `${Math.round(stop.dist)} m` : 'Distance —'}</span>
                      <span>zone {stop.radiusMeters} m</span>
                    </div>
                    {!stop.done && !stop.locked && (
                      <button
                        type="button"
                        className="primary"
                        disabled={busy || !wallet}
                        onClick={() => claimDropForStop(stop)}
                      >
                        {busy && activeStopId === stop.id
                          ? 'Clearing…'
                          : wallet
                            ? 'Claim drop & clear stop'
                            : 'Connect wallet'}
                      </button>
                    )}
                  </article>
                ))}
              </div>

              {(evaluation?.complete || (evaluation?.percent === 100)) && (
                <div className="rewardPanel">
                  <h3>Hunt complete</h3>
                  <p>Reward: <strong>{hunt.reward?.name}</strong> · {hunt.reward?.rarity}</p>
                  {progress?.rewardMinted ? (
                    <p className="minted">
                      Reward recorded
                      {progress.rewardTxHash && progress.rewardTxHash !== 'demo-local'
                        ? ` · ${progress.rewardTxHash.slice(0, 14)}…`
                        : ' · demo'}
                    </p>
                  ) : (
                    <button type="button" className="primary" disabled={busy || !wallet} onClick={mintHuntReward}>
                      {busy
                        ? 'Minting…'
                        : hasNftContract()
                          ? `Mint reward on ${EVM_CHAIN_NAME} (ETH gas)`
                          : 'Mark complete (demo — no contract)'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="empty">{loading ? 'Loading hunts…' : 'Select a scavenger job'}</p>
          )}
        </div>
      </section>

      {status && (
        <div className="statusBar"><span>●</span>{status}<button type="button" onClick={() => setStatus('')}>×</button></div>
      )}

      <style jsx>{`
        .huntRoot{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .huntNav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.92);backdrop-filter:blur(16px);position:sticky;top:0;z-index:40}
        .brand{font-size:16px;font-weight:950;letter-spacing:.14em;text-decoration:none;color:#fff}.brand span{color:#9b7cff}
        .navLinks{display:flex;gap:18px;font-size:13px}.navLinks a{color:#9da3b5;text-decoration:none}.navLinks a.active,.navLinks a:hover{color:#fff}
        .walletBtn{border:1px solid rgba(255,255,255,.14);background:#0b0d15;border-radius:999px;padding:10px 14px;color:#fff;font-weight:800;cursor:pointer}
        .huntHero{max-width:1100px;margin:0 auto;padding:40px 5vw 12px}
        .eyebrow{font-size:10px;letter-spacing:.18em;color:#8e95aa;font-weight:850;margin-bottom:12px}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 12px #55e6ff;margin-right:8px}
        .huntHero h1{font-size:clamp(40px,6vw,72px);line-height:.92;margin:0 0 12px;font-weight:950}
        .huntHero h1 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}
        .huntHero p{color:#a7adbe;max-width:620px;line-height:1.65}
        .huntLayout{max-width:1200px;margin:0 auto;padding:20px 5vw 80px;display:grid;grid-template-columns:320px 1fr;gap:18px}
        .huntList h3{margin:0 0 12px;font-size:12px;letter-spacing:.14em;color:#8e95aa}
        .huntCard{width:100%;text-align:left;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px;margin-bottom:10px;color:#fff;cursor:pointer}
        .huntCard.on{border-color:rgba(155,124,255,.5);background:rgba(155,124,255,.08)}
        .huntCard strong{display:block;margin-bottom:4px}.huntCard span{font-size:11px;color:#7f879b;text-transform:uppercase;letter-spacing:.06em}
        .huntCard p{margin:8px 0 0;font-size:12px;color:#9da3b5;line-height:1.45}
        .huntCard em{display:block;margin-top:6px;font-size:10px;color:#55e6ff;font-style:normal}
        .huntDetail{border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:22px;background:rgba(8,10,17,.95)}
        .detailHead{display:flex;justify-content:space-between;gap:16px;align-items:start}
        .detailHead h2{margin:6px 0 8px;font-size:clamp(28px,4vw,40px)}
        .detailHead p{color:#a0a6b8;margin:0;line-height:1.55}
        .progressRing{min-width:88px;height:88px;border-radius:50%;border:2px solid rgba(85,230,255,.35);display:grid;place-items:center;text-align:center}
        .progressRing b{font-size:20px;display:block}.progressRing span{font-size:11px;color:#7f879b}
        .bar{height:6px;background:rgba(255,255,255,.06);border-radius:999px;margin:18px 0 16px;overflow:hidden}
        .bar i{display:block;height:100%;background:linear-gradient(90deg,#9b7cff,#55e6ff);transition:width .3s}
        .miniMap{position:relative;height:160px;border-radius:16px;margin-bottom:18px;border:1px solid rgba(255,255,255,.08);background:radial-gradient(circle at 50% 40%,rgba(85,230,255,.06),transparent 50%),#070912}
        .mPin{position:absolute;transform:translate(-50%,-50%);border:0;background:transparent;cursor:pointer;padding:8px}
        .mPin span{display:block;width:12px;height:12px;border-radius:50%;background:#9b7cff;box-shadow:0 0 12px #9b7cff}
        .mPin.next span{background:#55e6ff;box-shadow:0 0 14px #55e6ff}.mPin.done span{background:#6d7280;box-shadow:none}.mPin.locked{opacity:.35;cursor:default}
        .you{position:absolute;width:14px;height:14px;border-radius:50%;background:#55e6ff;border:2px solid #fff;transform:translate(-50%,-50%);box-shadow:0 0 16px #55e6ff}
        .stopList{display:grid;gap:12px}
        .stop{border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px;background:rgba(255,255,255,.02)}
        .stop.next{border-color:rgba(85,230,255,.4)}.stop.done{opacity:.7}.stop.locked{opacity:.4}
        .stopTop{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
        .ord{font-size:11px;color:#55e6ff;font-weight:900}
        .tag{font-size:9px;letter-spacing:.12em;padding:3px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.12);color:#cfc6ff}
        .nextTag{border-color:rgba(85,230,255,.4);color:#55e6ff}.lockTag{color:#7f879b}
        .clue{margin:0 0 8px;color:#b7bed0;font-style:italic;font-size:13px}
        .stopMeta{display:flex;gap:12px;font-size:11px;color:#6f7587;margin-bottom:10px;flex-wrap:wrap}
        .primary{border-radius:999px;padding:11px 16px;font-weight:850;cursor:pointer;border:1px solid #fff;background:#fff;color:#07080c}
        .primary:disabled{opacity:.5;cursor:wait}
        .rewardPanel{margin-top:20px;padding:18px;border-radius:18px;border:1px solid rgba(155,124,255,.35);background:rgba(155,124,255,.08)}
        .rewardPanel h3{margin:0 0 8px}.minted{color:#55e6ff}
        .empty{color:#7f879b}
        .statusBar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:80;background:#11141e;border:1px solid rgba(255,255,255,.14);padding:11px 14px;border-radius:999px;display:flex;gap:9px;align-items:center;font-size:12px;max-width:min(920px,94vw)}.statusBar span{color:#9b7cff}.statusBar button{border:0;background:transparent;color:#8e94a7;cursor:pointer}
        @media(max-width:900px){.huntLayout{grid-template-columns:1fr}.navLinks{display:none}}
      `}</style>
    </main>
  );
}

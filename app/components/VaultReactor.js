'use client';

import { useEffect, useMemo, useState } from 'react';
import { accrueEnergy, createExpedition, getReactorState, spendEnergy } from '../../lib/idleExpedition';

const STORAGE_KEY = 'voxel-vault-reactor-v2';
const DEFAULT = { active: false, startedAt: 0, energy: 0, earnedToday: 0, lastDay: new Date().toISOString().slice(0, 10), completed: [] };
const EXPEDITIONS = [
  createExpedition({ id: 'scan-15', minutes: 15, energyCost: 10, label: 'Scout a hidden Vault route' }),
  createExpedition({ id: 'catalog-30', minutes: 30, energyCost: 20, label: 'Curate three collectibles' }),
  createExpedition({ id: 'hunt-60', minutes: 60, energyCost: 35, label: 'Run a long-form scavenger mission' }),
];

function loadState() {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed) return DEFAULT;
    const today = new Date().toISOString().slice(0, 10);
    return parsed.lastDay === today ? { ...DEFAULT, ...parsed } : { ...DEFAULT, ...parsed, earnedToday: 0, lastDay: today };
  } catch { return DEFAULT; }
}

export default function VaultReactor() {
  const [state, setState] = useState(DEFAULT);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');

  useEffect(() => setState(loadState()), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const reactor = useMemo(() => getReactorState(now, state), [now, state]);
  const preview = accrueEnergy({ minutes: reactor.elapsedMinutes, currentEnergy: state.energy, earnedToday: state.earnedToday });
  const displayedEnergy = state.energy + Math.max(0, preview.earned);
  const minutes = Math.min(Math.floor(reactor.elapsedMinutes), 180);

  function start() {
    setMessage('Reactor online. Your Vault can progress while you are away.');
    setState(s => ({ ...s, active: true, startedAt: Date.now() }));
  }

  function stop() {
    const gained = accrueEnergy({ minutes: reactor.elapsedMinutes, currentEnergy: state.energy, earnedToday: state.earnedToday });
    setState(s => ({ ...s, active: false, startedAt: 0, energy: gained.energy, earnedToday: s.earnedToday + gained.earned }));
    setMessage(gained.earned ? `+${gained.earned} Vault Energy banked.` : 'Daily Reactor cap reached.');
  }

  function launch(expedition) {
    try {
      const next = spendEnergy(displayedEnergy, expedition.energyCost);
      setState(s => ({ ...s, active: false, startedAt: 0, energy: next, completed: [...new Set([...s.completed, expedition.id])] }));
      setMessage(`${expedition.label} launched. Rewards remain subject to verified hunt/claim rules.`);
    } catch (error) { setMessage(error.message); }
  }

  return (
    <section className="reactorShell" aria-labelledby="reactor-title">
      <div className="reactorHead"><div><div className="reactorEyebrow">✦ BACKGROUND MODE</div><h2 id="reactor-title">Vault Reactor</h2><p>Leave it running while you work, study, or step away. It earns capped Vault Energy, not fake browser crypto.</p></div><div className={`reactorOrb ${state.active ? 'on' : ''}`} aria-label={state.active ? 'Reactor active' : 'Reactor idle'} /></div>
      <div className="reactorStats"><div><b>{Math.floor(displayedEnergy)}</b><span>Energy</span></div><div><b>{minutes}m</b><span>Session</span></div><div><b>{state.earnedToday}/240</b><span>Daily cap</span></div></div>
      <div className="reactorActions"><button onClick={state.active ? stop : start}>{state.active ? 'Bank & pause' : 'Start background run'}</button><small>Runs locally and visibly. No hidden CPU mining, wallet signing, or secret charges.</small></div>
      <div className="expeditionGrid">{EXPEDITIONS.map(expedition => <button key={expedition.id} disabled={state.completed.includes(expedition.id) || displayedEnergy < expedition.energyCost} onClick={() => launch(expedition)}><span>{state.completed.includes(expedition.id) ? '✓ Completed' : `−${expedition.energyCost} Energy`}</span><b>{expedition.label}</b><small>{expedition.minutes} min mission · verified reward path</small></button>)}</div>
      {message && <div className="reactorMessage" role="status">{message}</div>}
      <style jsx>{` .reactorShell{margin:0 5vw 90px;padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:26px;background:linear-gradient(145deg,rgba(18,16,35,.9),rgba(8,9,17,.96));box-shadow:0 24px 80px rgba(0,0,0,.25)}.reactorHead{display:flex;justify-content:space-between;gap:24px;align-items:center}.reactorEyebrow{font-size:11px;letter-spacing:.16em;color:#9b7cff;font-weight:800}.reactorShell h2{font-size:30px;margin:6px 0}.reactorShell p{color:#9da3b5;max-width:650px;margin:0;line-height:1.6}.reactorOrb{width:58px;height:58px;border-radius:50%;border:1px solid rgba(155,124,255,.4);background:radial-gradient(circle,#bba7ff 0 4%,rgba(155,124,255,.2) 12%,transparent 65%);box-shadow:0 0 34px rgba(155,124,255,.14)}.reactorOrb.on{animation:pulse 2s ease-in-out infinite;box-shadow:0 0 46px rgba(155,124,255,.32)}.reactorStats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.reactorStats div{padding:16px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.reactorStats b{display:block;font-size:23px}.reactorStats span{font-size:11px;color:#858da0;text-transform:uppercase;letter-spacing:.1em}.reactorActions{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.reactorActions button{border:0;border-radius:999px;padding:12px 18px;background:#f4f4f7;color:#080910;font-weight:800;cursor:pointer}.reactorActions small{color:#737b8d}.expeditionGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}.expeditionGrid button{text-align:left;padding:17px;border-radius:17px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);cursor:pointer}.expeditionGrid button:disabled{opacity:.42;cursor:not-allowed}.expeditionGrid span,.expeditionGrid small{display:block;color:#8d95a8;font-size:11px}.expeditionGrid b{display:block;margin:8px 0;color:#fff}.reactorMessage{margin-top:16px;color:#c9c2ff;font-size:13px}@keyframes pulse{50%{transform:scale(1.04);opacity:.8}}@media(max-width:720px){.reactorShell{margin:0 18px 60px;padding:20px}.reactorStats{grid-template-columns:1fr}.expeditionGrid{grid-template-columns:1fr}.reactorHead{align-items:flex-start}.reactorOrb{flex:none}}`}</style>
    </section>
  );
}

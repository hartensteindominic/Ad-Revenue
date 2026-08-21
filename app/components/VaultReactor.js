'use client';

import { useEffect, useMemo, useState } from 'react';
import { IDLE_RULES, accrueEnergy, getReactorState, spendEnergy } from '@/lib/idleExpedition';

const STORAGE_KEY = 'voxel-vault-reactor-v1';
const DEFAULT_STATE = { active: false, startedAt: 0, energy: 0, earnedToday: 0, day: '' };

function today() { return new Date().toISOString().slice(0, 10); }
function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    const day = parsed.day === today() ? parsed.day : today();
    return { ...DEFAULT_STATE, ...parsed, day, earnedToday: parsed.day === day ? Math.max(0, Number(parsed.earnedToday) || 0) : 0, energy: Math.max(0, Number(parsed.energy) || 0) };
  } catch { return { ...DEFAULT_STATE, day: today() }; }
}

export default function VaultReactor() {
  const [state, setState] = useState({ ...DEFAULT_STATE, day: today() });

  useEffect(() => setState(readState()), []);
  useEffect(() => {
    if (!state.active) return undefined;
    const id = window.setInterval(() => setState(current => ({ ...current })), 30000);
    return () => window.clearInterval(id);
  }, [state.active]);

  const reactor = useMemo(() => getReactorState(Date.now(), state), [state]);
  const projection = useMemo(() => accrueEnergy({ minutes: reactor.elapsedMinutes, currentEnergy: state.energy, earnedToday: state.earnedToday }), [reactor.elapsedMinutes, state.energy, state.earnedToday]);
  const progress = Math.min(100, (reactor.elapsedMinutes / IDLE_RULES.maxSessionMinutes) * 100);

  function persist(next) {
    setState(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* UI remains usable when storage is unavailable. */ }
  }

  function start() {
    if (state.earnedToday >= IDLE_RULES.dailyEnergyCap) return;
    persist({ ...state, active: true, startedAt: Date.now(), day: today() });
  }

  function bank() {
    const earned = projection.earned;
    persist({ ...state, active: false, startedAt: 0, energy: projection.energy, earnedToday: Math.min(IDLE_RULES.dailyEnergyCap, state.earnedToday + earned), day: today() });
  }

  function queueMission() {
    if (state.energy < 10) return;
    persist({ ...state, energy: spendEnergy(state.energy, 10) });
  }

  return (
    <section className="reactor" aria-label="Vault Reactor background play">
      <div className="reactorGlow" />
      <div className="reactorHead"><div><span className="eyebrow">BACKGROUND PLAY</span><h2>Vault Reactor</h2><p>Let your Vault progress while you're busy. Energy is a gameplay resource, not cryptocurrency mining.</p></div><div className="energy"><b>{state.energy}</b><span>VAULT ENERGY</span></div></div>
      <div className="bar"><i style={{ width: `${progress}%` }} /></div>
      <div className="stats"><span>{state.active ? `${Math.floor(reactor.elapsedMinutes)} min active` : 'Ready to run'}</span><span>{Math.max(0, IDLE_RULES.dailyEnergyCap - state.earnedToday)} Energy available today</span></div>
      <div className="actions"><button onClick={state.active ? bank : start} disabled={!state.active && state.earnedToday >= IDLE_RULES.dailyEnergyCap}>{state.active ? 'Bank Energy' : 'Start Reactor'}</button><button className="secondary" onClick={queueMission} disabled={state.energy < 10}>Queue Mission · 10 Energy</button></div>
      <small>Session cap {IDLE_RULES.maxSessionMinutes} min · daily cap {IDLE_RULES.dailyEnergyCap} Energy. Valuable rewards require verified activity and an explicit wallet claim.</small>
      <style jsx>{`.reactor{position:relative;margin:0 5vw 48px;padding:22px 24px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(135deg,rgba(18,17,31,.97),rgba(8,10,17,.97));overflow:hidden}.reactorGlow{position:absolute;width:260px;height:260px;right:-120px;top:-150px;border-radius:50%;background:rgba(123,91,255,.15);filter:blur(55px)}.reactorHead{position:relative;display:flex;justify-content:space-between;gap:24px}.eyebrow{font-size:10px;letter-spacing:.16em;color:#9c8cff}.reactor h2{margin:6px 0 5px;font-size:24px}.reactor p{margin:0;color:#a5a9b8;font-size:13px;line-height:1.55;max-width:650px}.energy{text-align:right}.energy b{display:block;font-size:30px}.energy span{font-size:9px;letter-spacing:.12em;color:#858b9e}.bar{height:6px;background:#171a25;border-radius:99px;margin:20px 0 8px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#7b5cff,#37d6ff);transition:width .3s}.stats{display:flex;justify-content:space-between;color:#858b9e;font-size:11px}.actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}.actions button{border:0;border-radius:11px;padding:10px 15px;background:#f4f5f8;color:#080a10;font-weight:750;cursor:pointer}.actions button:disabled{opacity:.4;cursor:not-allowed}.actions .secondary{background:#111522;color:#dce0ea;border:1px solid rgba(255,255,255,.12)}.reactor small{display:block;margin-top:12px;color:#666c7c;font-size:10px}@media(max-width:640px){.reactor{margin:0 18px 30px;padding:18px}.reactorHead{display:block}.energy{text-align:left;margin-top:12px}.stats{flex-direction:column;gap:5px}.actions button{width:100%}}`}</style>
    </section>
  );
}

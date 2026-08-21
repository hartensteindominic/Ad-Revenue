'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'voxel-vault-ai-thread-v1';
const EVENTS_KEY = 'voxel-vault-events-v1';

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function collectSnapshot() {
  const events = readJson(EVENTS_KEY, []);
  const collection = readJson('voxel-vault-collection', []);
  return {
    items: Array.isArray(collection) ? collection : [],
    events: Array.isArray(events) ? events : [],
  };
}

export default function VaultAI() {
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => readJson(STORAGE_KEY, [
    { role: 'assistant', text: 'Vault AI is online. I can watch your local Vault activity, process collection data, and help you decide what to do next.' },
  ]));
  const endRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch {}
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const send = useCallback(async (text, mode = 'chat') => {
    const message = String(text || '').trim();
    if (busy || (!message && mode !== 'proactive')) return;
    if (mode === 'chat') setMessages((current) => [...current, { role: 'user', text: message }]);
    setBusy(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode, snapshot: collectSnapshot() }),
      });
      const data = await response.json().catch(() => ({}));
      setMessages((current) => [...current, {
        role: 'assistant',
        text: data.message || 'I could not process that yet.',
      }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'I lost the connection briefly. Your local Vault data was not changed.' }]);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  useEffect(() => {
    if (!auto || !open) return undefined;
    const timer = window.setInterval(() => send('', 'proactive'), 300_000);
    return () => window.clearInterval(timer);
  }, [auto, open, send]);

  const status = useMemo(() => busy ? 'THINKING' : auto ? 'WATCHING' : 'READY', [auto, busy]);

  return (
    <>
      <button className="vaultAiOrb" aria-label="Open Vault AI" onClick={() => setOpen(true)}>
        <span className="vaultAiOrbCore">✦</span>
        <span className="vaultAiOrbLabel">VAULT AI</span>
      </button>

      {open && <div className="vaultAiBackdrop" onClick={() => setOpen(false)}>
        <section className="vaultAiPanel" aria-label="Vault AI assistant" onClick={(event) => event.stopPropagation()}>
          <header className="vaultAiHeader">
            <div>
              <div className="vaultAiEyebrow"><span /> {status}</div>
              <h2>Vault AI</h2>
              <p>Local signals → useful decisions → user-confirmed actions.</p>
            </div>
            <button className="vaultAiClose" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </header>

          <div className="vaultAiControls">
            <button onClick={() => setAuto((value) => !value)} className={auto ? 'active' : ''}>
              {auto ? '● Auto pulse on' : '○ Auto pulse off'}
            </button>
            <button onClick={() => send('Give me a concise health check of my Vault and one high-value next step.')}>Run analysis</button>
          </div>

          <div className="vaultAiMessages">
            {messages.slice(-20).map((item, index) => (
              <div className={`vaultAiMessage ${item.role}`} key={`${index}-${item.text.slice(0, 12)}`}>
                <span className="vaultAiRole">{item.role === 'assistant' ? 'VAULT AI' : 'YOU'}</span>
                <p>{item.text}</p>
              </div>
            ))}
            {busy && <div className="vaultAiTyping"><span /> <span /> <span /></div>}
            <div ref={endRef} />
          </div>

          <form className="vaultAiComposer" onSubmit={(event) => { event.preventDefault(); const text = input; setInput(''); send(text); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Vault AI anything…" maxLength={1200} disabled={busy} />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </section>
      </div>}

      <style jsx>{`
        .vaultAiOrb{position:fixed;right:18px;bottom:24px;z-index:70;width:62px;height:62px;border-radius:20px;border:1px solid rgba(135,100,255,.55);background:linear-gradient(145deg,#171126,#080b13);color:#e9e2ff;box-shadow:0 12px 40px rgba(0,0,0,.45),0 0 28px rgba(116,76,255,.18);display:flex;align-items:center;justify-content:center;cursor:pointer}.vaultAiOrbCore{font-size:25px;line-height:1;background:linear-gradient(135deg,#c3a8ff,#55e6ff);-webkit-background-clip:text;background-clip:text;color:transparent}.vaultAiOrbLabel{position:absolute;bottom:-16px;font-size:7px;letter-spacing:.18em;color:#7f879b;font-weight:900}.vaultAiBackdrop{position:fixed;inset:0;z-index:80;background:rgba(1,2,6,.7);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;padding:14px}.vaultAiPanel{width:min(680px,100%);height:min(760px,calc(100dvh - 28px));display:flex;flex-direction:column;border:1px solid rgba(155,124,255,.3);border-radius:28px;background:linear-gradient(180deg,#0d0f18,#070910);box-shadow:0 30px 90px rgba(0,0,0,.6);overflow:hidden}.vaultAiHeader{display:flex;justify-content:space-between;gap:16px;padding:20px;border-bottom:1px solid rgba(255,255,255,.07)}.vaultAiEyebrow{font-size:8px;font-weight:900;letter-spacing:.18em;color:#62e8ff}.vaultAiEyebrow span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#62e8ff;box-shadow:0 0 12px #62e8ff;margin-right:7px}.vaultAiHeader h2{margin:6px 0 3px;font-size:25px;letter-spacing:-.04em}.vaultAiHeader p{margin:0;color:#777f93;font-size:11px}.vaultAiClose{width:34px;height:34px;border-radius:12px;border:1px solid #252938;background:#11141d;color:#bfc6d8;font-size:22px;cursor:pointer}.vaultAiControls{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);overflow:auto}.vaultAiControls button{white-space:nowrap;border:1px solid #272b3b;background:#10131c;color:#9da6bb;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:800;cursor:pointer}.vaultAiControls button.active{color:#72eaff;border-color:rgba(98,232,255,.3);background:rgba(98,232,255,.06)}.vaultAiMessages{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}.vaultAiMessage{max-width:88%;padding:12px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.06);background:#0f121b}.vaultAiMessage.user{align-self:flex-end;background:#171229;border-color:rgba(135,100,255,.18)}.vaultAiRole{font-size:7px;font-weight:900;letter-spacing:.16em;color:#697287}.vaultAiMessage p{white-space:pre-wrap;margin:5px 0 0;color:#d9deeb;font-size:12px;line-height:1.55}.vaultAiTyping{display:flex;gap:4px;padding:10px}.vaultAiTyping span{width:5px;height:5px;border-radius:50%;background:#7c5cff;animation:vaultAiPulse 1s infinite ease-in-out}.vaultAiTyping span:nth-child(2){animation-delay:.15s}.vaultAiTyping span:nth-child(3){animation-delay:.3s}@keyframes vaultAiPulse{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}.vaultAiComposer{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07);padding-bottom:max(12px,env(safe-area-inset-bottom))}.vaultAiComposer input{min-width:0;flex:1;border:1px solid #252938;background:#0c0f17;color:#eef1f8;border-radius:14px;padding:12px 13px;outline:none;font-size:13px}.vaultAiComposer input:focus{border-color:rgba(135,100,255,.55)}.vaultAiComposer button{border:0;background:#7654e8;color:#fff;border-radius:14px;padding:0 16px;font-weight:900;cursor:pointer}.vaultAiComposer button:disabled{opacity:.45}@media(max-width:700px){.vaultAiOrb{right:14px;bottom:calc(18px + env(safe-area-inset-bottom))}.vaultAiPanel{height:calc(100dvh - 14px);border-radius:24px}.vaultAiBackdrop{padding:7px}.vaultAiMessage{max-width:94%}}
      `}</style>
    </>
  );
}

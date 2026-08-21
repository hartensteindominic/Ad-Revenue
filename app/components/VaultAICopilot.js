'use client';

import { useMemo, useState } from 'react';

const DEMO_EVENTS = [
  { type: 'claim', wallet: 'demo-wallet-1', dropId: 'field-camera-001' },
  { type: 'claim', wallet: 'demo-wallet-2', dropId: 'field-camera-001' },
  { type: 'claim', wallet: 'demo-wallet-3', dropId: 'field-camera-001' },
  { type: 'settlement', valueEth: 0.027 },
];

export default function VaultAICopilot() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Vault AI is online. I can analyze activity, spot quality signals, and prepare bounded recommendations.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [insights, setInsights] = useState([]);
  const [notice, setNotice] = useState('Ready');

  const prompts = useMemo(() => ['Analyze the Vault', 'What looks hot?', 'Check for quality risks'], []);

  async function run(prompt = '') {
    if (busy) return;
    setBusy(true);
    setNotice('Processing bounded cycle…');
    if (prompt) setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    try {
      const response = await fetch('/api/ai/loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: DEMO_EVENTS,
          cycle: cycle + 1,
          conversation: [...messages, ...(prompt ? [{ role: 'user', content: prompt }] : [])].slice(-12),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI cycle failed');
      setCycle(data.cycle || cycle + 1);
      setInsights(data.insights || []);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Cycle completed.' }]);
      setNotice(data.requiresHumanApproval ? 'Recommendation ready · human approval required' : 'Analysis complete');
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `I could not complete that cycle safely: ${error?.message || 'unknown error'}` }]);
      setNotice('Safe fallback active');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await run(text);
  }

  return <section className="aiCopilot" aria-label="Vault AI Copilot">
    <div className="aiGlow" />
    <div className="aiHead">
      <div><div className="aiEyebrow"><span /> VAULT INTELLIGENCE · BOUNDED AUTONOMY</div><h2>Talk to the <em>Vault.</em></h2><p>Continuous analysis with hard safety boundaries. The AI can reason and recommend, but it cannot move funds or change ownership.</p></div>
      <div className="aiStatus"><b>{busy ? '● THINKING' : '● ONLINE'}</b><span>Cycle {cycle}/3</span></div>
    </div>
    <div className="aiBody">
      <div className="aiChat">
        {messages.slice(-8).map((message, index) => <div className={`aiMessage ${message.role}`} key={`${index}-${message.content.slice(0, 12)}`}><span className="aiRole">{message.role === 'assistant' ? 'AI' : 'YOU'}</span><p>{message.content}</p></div>)}
        {busy && <div className="aiMessage assistant"><span className="aiRole">AI</span><p className="thinking">Processing <i/><i/><i/></p></div>}
      </div>
      <div className="aiRail"><div className="railLabel">QUICK ANALYSIS</div>{prompts.map(prompt => <button key={prompt} onClick={() => run(prompt)} disabled={busy}>{prompt} ↗</button>)}<div className="aiSignal"><span>●</span><div><b>{notice}</b><small>{insights.length ? `${insights.length} signals detected this cycle` : 'No signals loaded yet'}</small></div></div></div>
    </div>
    <div className="aiComposer"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask the Vault AI…" maxLength={600} /><button onClick={send} disabled={busy || !input.trim()}>Send</button></div>
    <div className="aiFoot"><span>🔒 No autonomous fund transfers</span><span>⛓️ Ownership stays on-chain</span><span>✓ Human approval for sensitive actions</span></div>
    <style jsx>{`.aiCopilot{max-width:1400px;margin:0 auto 44px;padding:28px 5vw;position:relative}.aiGlow{position:absolute;inset:12% 12%;background:radial-gradient(circle,rgba(119,81,255,.13),transparent 62%);filter:blur(40px);pointer-events:none}.aiHead,.aiBody,.aiComposer,.aiFoot{position:relative}.aiHead{display:flex;justify-content:space-between;gap:28px;padding:24px 26px;border:1px solid rgba(155,124,255,.25);border-radius:24px 24px 0 0;background:linear-gradient(135deg,rgba(17,15,31,.96),rgba(7,13,22,.96))}.aiEyebrow{font-size:9px;letter-spacing:.2em;color:#8e95aa;font-weight:900}.aiEyebrow span{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 15px #55e6ff;margin-right:8px}.aiHead h2{font-size:clamp(30px,4vw,50px);letter-spacing:-.05em;margin:9px 0 5px}.aiHead h2 em{font-style:normal;color:#a183ff}.aiHead p{font-size:12px;color:#8e95aa;max-width:700px;margin:0;line-height:1.6}.aiStatus{min-width:110px;text-align:right;font-family:ui-monospace,monospace}.aiStatus b{display:block;font-size:10px;color:#55e6ff;letter-spacing:.12em}.aiStatus span{display:block;color:#6f778c;font-size:10px;margin-top:6px}.aiBody{display:grid;grid-template-columns:1fr 260px;border:1px solid rgba(255,255,255,.08);border-top:0;background:#080a10}.aiChat{min-height:310px;max-height:380px;overflow:auto;padding:18px}.aiMessage{display:grid;grid-template-columns:32px 1fr;gap:10px;margin-bottom:13px}.aiRole{font:800 9px ui-monospace,monospace;color:#697187;padding-top:3px}.aiMessage p{margin:0;color:#cdd2df;font-size:12px;line-height:1.55}.aiMessage.user p{color:#b39cff}.aiMessage.assistant p{color:#d8dce8}.thinking{color:#737c90!important}.thinking i{display:inline-block;width:4px;height:4px;border-radius:50%;background:#8f78ff;margin-left:3px;animation:pulse 1s infinite}.thinking i:nth-child(2){animation-delay:.15s}.thinking i:nth-child(3){animation-delay:.3s}@keyframes pulse{50%{opacity:.25}}.aiRail{border-left:1px solid rgba(255,255,255,.08);padding:18px}.railLabel{font:900 9px ui-monospace,monospace;letter-spacing:.14em;color:#697187;margin-bottom:10px}.aiRail button{display:block;width:100%;text-align:left;border:1px solid rgba(255,255,255,.08);background:#0c0f17;color:#adb4c5;border-radius:10px;padding:10px;margin-bottom:8px;font-size:11px;cursor:pointer}.aiRail button:hover:not(:disabled){border-color:rgba(155,124,255,.4);color:#fff}.aiRail button:disabled{opacity:.5;cursor:wait}.aiSignal{margin-top:22px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:9px}.aiSignal>span{color:#55e6ff;font-size:10px}.aiSignal b,.aiSignal small{display:block}.aiSignal b{font-size:9px;color:#bfc5d5}.aiSignal small{font-size:9px;color:#626b80;margin-top:4px;line-height:1.4}.aiComposer{display:flex;gap:8px;padding:12px;border:1px solid rgba(255,255,255,.08);border-top:0;background:#0b0d14}.aiComposer input{min-width:0;flex:1;background:#05060b;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 14px;color:#fff;outline:none;font-size:12px}.aiComposer input:focus{border-color:rgba(155,124,255,.55)}.aiComposer button{border:0;border-radius:12px;padding:0 17px;background:#7654ff;color:#fff;font-weight:850;cursor:pointer}.aiComposer button:disabled{opacity:.4;cursor:not-allowed}.aiFoot{display:flex;gap:18px;flex-wrap:wrap;padding:12px 15px;background:#080a10;border:1px solid rgba(255,255,255,.06);border-top:0;border-radius:0 0 20px 20px;color:#667086;font-size:9px;letter-spacing:.04em}.aiFoot span:first-child{color:#7f88a0}@media(max-width:720px){.aiCopilot{padding:18px 16px}.aiHead{padding:20px;flex-direction:column}.aiStatus{text-align:left}.aiBody{grid-template-columns:1fr}.aiRail{border-left:0;border-top:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr;gap:8px}.aiRail button{margin:0}.railLabel,.aiSignal{grid-column:1/-1}.aiComposer{padding:10px}.aiFoot{gap:9px 14px}}`}</style>
  </section>;
}

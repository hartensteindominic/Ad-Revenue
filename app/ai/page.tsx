'use client';

import { useState } from 'react';
import Link from 'next/link';

const prompts = [
  'Explain my collection',
  'Research this object',
  'Explain quantum computing',
  'Help me find something nearby',
  'Propose a safe UI polish',
];

export default function AIPage() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!prompt.trim()) return;
    setBusy(true);
    setAnswer('');
    try {
      const r = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const d = await r.json();
      setAnswer(d.answer || d.error || 'No response.');
    } catch {
      setAnswer('AI request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header>
        <Link href="/" className="back" aria-label="Back">‹</Link>
        <div>
          <small>VOXEL VAULT</small>
          <h1>AI</h1>
        </div>
        <Link href="/room" className="room">◇</Link>
      </header>

      <section className="hero">
        <div className="orb">✦</div>
        <small>OBJECT INTELLIGENCE</small>
        <h2>Your Vault, understood.</h2>
        <p>
          Ask about objects, purchases, provenance, science, or your collection.
          The assistant is bounded, monitored, and never changes ownership or code without you.
        </p>
      </section>

      <section className="chips">
        {prompts.map(p => (
          <button key={p} onClick={() => setPrompt(p)}>{p}</button>
        ))}
      </section>

      <section className="chat">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          maxLength={4000}
          placeholder="Ask Voxel AI…"
          aria-label="Ask Voxel AI"
        />
        <div className="bottom">
          <span>{prompt.length}/4000</span>
          <button className="btn" onClick={ask} disabled={busy || !prompt.trim()}>
            {busy ? 'Thinking…' : 'Ask →'}
          </button>
        </div>
        {answer && (
          <article>
            <small>VOXEL AI · MONITORED</small>
            <p>{answer}</p>
          </article>
        )}
      </section>

      <section className="agency">
        <small>BOUNDED AGENCY</small>
        <p>
          The assistant may research, organize, simulate, and propose changes.
          It cannot spend money, transfer ownership, publish a sale, or rewrite production code
          without explicit human approval. All code suggestions remain proposals only.
        </p>
      </section>

      <section className="links">
        <Link href="/quantum">⚛ Quantum Lab · classical simulation</Link>
        <Link href="/receipt">▣ Scan receipt</Link>
        <Link href="/room">◇ My Room</Link>
      </section>

      <footer>
        <Link href="/">Find</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #05060b;
          color: #f6f7fb;
          padding: 0 16px 40px;
          font-family: Inter, system-ui, sans-serif;
        }
        .page a {
          text-decoration: none !important;
          color: inherit;
        }
        .page header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .back {
          font-size: 26px;
          color: #fff !important;
          width: 36px;
        }
        .room {
          font-size: 18px;
          color: #fff !important;
          width: 36px;
          text-align: right;
        }
        .page header div { text-align: center; }
        .page header small, .hero small, .agency small {
          font-size: 7px;
          letter-spacing: .18em;
          color: #a996ff;
          font-weight: 900;
        }
        .page h1 {
          font-size: 18px;
          margin: 4px 0;
        }
        .hero { padding: 30px 0 20px; }
        .orb {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid rgba(169,150,255,.4);
          background: radial-gradient(circle, rgba(169,150,255,.2), transparent 65%);
          font-size: 28px;
          margin-bottom: 13px;
        }
        .hero h2 {
          font-size: 31px;
          letter-spacing: -.04em;
          margin: 7px 0;
        }
        .hero p, .agency p {
          font-size: 11px;
          line-height: 1.55;
          color: #7e8798;
        }
        .chips {
          display: flex;
          gap: 7px;
          overflow: auto;
          padding-bottom: 12px;
          scrollbar-width: none;
        }
        .chips::-webkit-scrollbar { display: none; }
        .chips button {
          white-space: nowrap;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #b8c0cf;
          border-radius: 999px;
          padding: 9px 11px;
          font-size: 9px;
          cursor: pointer;
        }
        .chat {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          border-radius: 20px;
          padding: 12px;
        }
        .chat textarea {
          width: 100%;
          min-height: 130px;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: #fff;
          font: inherit;
          font-size: 13px;
        }
        .bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #626d80;
          font-size: 8px;
        }
        .btn {
          border: 0;
          border-radius: 11px;
          padding: 11px 14px;
          background: #f5f6f9 !important;
          color: #08090d !important;
          font-weight: 900;
          font-size: 10px;
          cursor: pointer;
        }
        .btn:disabled { opacity: .45; cursor: not-allowed; }
        .chat article {
          margin-top: 12px;
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 12px;
        }
        .chat article small {
          font-size: 7px;
          color: #a996ff;
          letter-spacing: .14em;
        }
        .chat article p {
          font-size: 11px;
          line-height: 1.55;
          color: #c2c8d4;
          white-space: pre-wrap;
        }
        .agency {
          margin-top: 14px;
          border: 1px solid rgba(169,145,255,.2);
          background: rgba(169,145,255,.05);
          border-radius: 16px;
          padding: 14px;
        }
        .agency p { margin: 8px 0 0; }
        .links {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }
        .links a {
          padding: 14px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          background: rgba(255,255,255,.04);
          color: #d9dce4 !important;
          font-size: 10px;
        }
        footer {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-top: 20px;
        }
        footer a {
          color: #687184 !important;
          font-size: 9px;
        }
        @media (min-width: 700px) {
          .page { max-width: 640px; margin: auto; }
        }
      `}</style>
    </main>
  );
}

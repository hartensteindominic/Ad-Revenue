'use client';

import { useEffect, useState } from 'react';
import { getSavedVaultItems, removeSavedCollectible, shareCurrentCollectible } from '../../lib/native';

export default function MyVaultPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSavedVaultItems().then((saved) => setItems(saved)).finally(() => setLoaded(true));
  }, []);

  async function remove(url) {
    await removeSavedCollectible(url);
    setItems((current) => current.filter((item) => item.url !== url));
  }

  async function share(item) {
    await shareCurrentCollectible({ title: item.title, text: 'Explore this collectible in Voxel Vault.', url: item.url });
  }

  return (
    <main className="myVault">
      <nav className="nav">
        <a href="/" className="brand">V<span>V</span>OXELVAULT</a>
        <a href="/" className="back">← Vault</a>
      </nav>

      <section className="content">
        <div className="eyebrow">IPHONE COLLECTION</div>
        <h1>My <em>Vault.</em></h1>
        <p className="intro">Your saved discoveries stay on this device, ready to revisit or share. This is a local companion feature, not a replacement for on-chain ownership.</p>

        {!loaded ? <div className="empty">Loading your saved Vault…</div> : null}
        {loaded && !items.length ? (
          <div className="empty">
            <strong>Your Vault is empty.</strong>
            <span>Open a collectible and tap ＋ Save to keep it here.</span>
            <a href="/">Explore the 3D Vault →</a>
          </div>
        ) : null}

        <div className="grid">
          {items.map((item) => (
            <article className="card" key={item.url}>
              <div className="orb"><span>◇</span></div>
              <div className="info">
                <div className="eyebrow small">SAVED DISCOVERY</div>
                <h2>{item.title}</h2>
                <p>{item.description || 'Voxel Vault collectible'}</p>
                <small>{item.savedAt ? new Date(item.savedAt).toLocaleDateString() : ''}</small>
              </div>
              <div className="actions">
                <a href={item.url}>Open ↗</a>
                <button onClick={() => share(item)}>Share</button>
                <button onClick={() => remove(item.url)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .myVault{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .nav{height:78px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.88);backdrop-filter:blur(18px);position:sticky;top:0;z-index:10}
        .brand{color:#fff;text-decoration:none;font-size:18px;font-weight:950;letter-spacing:.15em}.brand span{color:#9b7cff}.back{color:#aeb4c8;text-decoration:none;font-size:12px;font-weight:800}
        .content{width:min(1000px,90vw);margin:0 auto;padding:72px 0 130px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#8e95aa;font-weight:850;margin-bottom:14px}.small{margin-bottom:7px;font-size:8px}
        h1{font-size:clamp(54px,9vw,96px);line-height:.9;letter-spacing:-.06em;margin:0 0 20px}h1 em,h2 em{color:#a183ff;font-style:normal}.intro{max-width:680px;color:#8f96aa;line-height:1.7;font-size:14px;margin:0 0 42px}
        .grid{display:grid;gap:14px}.card{display:grid;grid-template-columns:90px 1fr auto;gap:18px;align-items:center;padding:18px;border:1px solid rgba(255,255,255,.09);border-radius:20px;background:linear-gradient(135deg,rgba(17,19,30,.96),rgba(10,11,18,.96));box-shadow:0 18px 60px rgba(0,0,0,.2)}
        .orb{width:90px;height:90px;border-radius:18px;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,rgba(157,122,255,.55),transparent 35%),linear-gradient(145deg,#171229,#0c0e17);border:1px solid rgba(141,109,255,.32);box-shadow:inset 0 0 30px rgba(115,80,255,.12)}.orb span{font-size:30px;color:#b69dff}
        h2{font-size:22px;letter-spacing:-.02em;margin:0 0 7px}.info p{margin:0 0 6px;color:#83899c;font-size:12px}.info small{color:#5f6578;font-size:9px}.actions{display:flex;gap:7px;align-items:center}.actions a,.actions button{border:1px solid #292d40;border-radius:10px;background:#11141e;color:#c9cede;text-decoration:none;padding:9px 11px;font-size:10px;font-weight:800;cursor:pointer}.actions a{background:#17142a;border-color:#4b3b75;color:#e8e1ff}
        .empty{min-height:260px;border:1px dashed #2b2f42;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;color:#81889b;text-align:center;padding:30px}.empty strong{color:#fff;font-size:18px}.empty a{margin-top:9px;color:#b49cff;text-decoration:none;font-weight:800;font-size:12px}
        @media(max-width:700px){.content{padding-top:52px}.card{grid-template-columns:64px 1fr}.orb{width:64px;height:64px}.actions{grid-column:1 / -1;justify-content:flex-start}.actions a,.actions button{flex:1;text-align:center}.intro{font-size:13px}}
      `}</style>
    </main>
  );
}

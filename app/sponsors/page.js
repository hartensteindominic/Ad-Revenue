'use client';

import Link from 'next/link';

const formats = [
  ['3D Drop', 'A branded or collaborative 3D object that collectors can display, trade and discover.'],
  ['Hunt Drop', 'A collectible hidden behind a QR-first physical discovery flow, with BLE as an enhancement where supported.'],
  ['Creator Collaboration', 'Sponsor production while the creator remains the visible creative owner of the campaign concept.'],
  ['Event Collection', 'A time-boxed set of digital artifacts tied to an event, venue or community activation.'],
];

export default function SponsorsPage() {
  return (
    <main className="sponsorPage">
      <nav><Link href="/" className="brand">V<span>V</span>OXELVAULT</Link><Link href="/">← Back to Vault</Link></nav>
      <section className="sponsorHero">
        <div className="eyebrow">SPONSORED COLLECTIBLE NETWORK</div>
        <h1>Don't buy a banner.<br /><em>Build an object.</em></h1>
        <p>
          Voxel Vault turns campaign funding into collectible 3D and 2D objects. People can discover them, inspect them, hunt for them, own them and trade them. Sponsorship is disclosed instead of hidden.
        </p>
        <div className="actions"><Link href="/#sponsored-collectibles" className="primary">View sponsor-ready formats</Link><Link href="/" className="secondary">Explore the Vault</Link></div>
      </section>

      <section className="formats">
        <div className="eyebrow">CAMPAIGN FORMATS</div>
        <h2>Advertising that survives the scroll.</h2>
        <div className="formatGrid">{formats.map(([title, copy]) => <article key={title}><div className="icon">◇</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="trust">
        <div><div className="eyebrow">THE RULES</div><h2>Collectible first.<br /><em>Campaign second.</em></h2></div>
        <ul>
          <li><b>Disclosure:</b> sponsored status is visible in the collectible experience and metadata.</li>
          <li><b>Ownership:</b> discovery never grants ownership. Wallet authorization and on-chain state remain authoritative.</li>
          <li><b>No invented reach:</b> campaign metrics will only appear after measured events exist.</li>
          <li><b>Cross-platform:</b> QR is the dependable discovery path. BLE/NFC can enhance supported devices without becoming the security boundary.</li>
          <li><b>Creative independence:</b> creators and communities can publish non-sponsored collectibles alongside campaigns.</li>
        </ul>
      </section>

      <style jsx>{`
        .sponsorPage{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.sponsorPage nav{height:78px;padding:0 6vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:rgba(5,6,11,.86);backdrop-filter:blur(18px);z-index:10}.sponsorPage nav a{color:#9da4b8;text-decoration:none;font-size:13px}.brand{font-size:18px!important;font-weight:950;letter-spacing:.15em;color:#fff!important}.brand span{color:#9b7cff}.sponsorHero{max-width:1180px;margin:0 auto;padding:110px 6vw 100px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#8e95aa;font-weight:850;margin-bottom:18px}.sponsorHero h1{font-size:clamp(56px,8vw,112px);line-height:.9;letter-spacing:-.065em;margin:0 0 28px}.sponsorHero h1 em,.trust h2 em{font-style:normal;color:#a98cff}.sponsorHero p{max-width:720px;color:#aab0c0;font-size:18px;line-height:1.75}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.primary,.secondary{padding:13px 17px;border-radius:999px;text-decoration:none;font-weight:850;font-size:13px}.primary{background:#a98cff;color:#0a0714}.secondary{border:1px solid rgba(255,255,255,.14);color:#eef0f7}.formats{max-width:1180px;margin:0 auto;padding:30px 6vw 110px}.formats h2,.trust h2{font-size:clamp(36px,5vw,68px);letter-spacing:-.05em;line-height:.95;margin:0 0 30px}.formatGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.formatGrid article{padding:24px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.icon{color:#a98cff;font-size:28px}.formatGrid h3{margin:20px 0 9px}.formatGrid p{color:#9299ad;font-size:12px;line-height:1.7}.trust{max-width:1180px;margin:0 auto;padding:40px 6vw 120px;display:grid;grid-template-columns:.9fr 1.1fr;gap:50px;border-top:1px solid rgba(255,255,255,.08)}.trust ul{margin:0;padding:0;list-style:none;display:grid;gap:14px}.trust li{padding:16px 0;border-bottom:1px solid rgba(255,255,255,.07);color:#aab0c0;font-size:13px;line-height:1.7}.trust b{color:#f0f1f8}@media(max-width:900px){.formatGrid{grid-template-columns:1fr 1fr}.trust{grid-template-columns:1fr}}@media(max-width:560px){.formatGrid{grid-template-columns:1fr}.sponsorHero{padding-top:72px}}
      `}</style>
    </main>
  );
}

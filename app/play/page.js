'use client';

import Link from 'next/link';

const lanes = [
  { href: '/discover', label: 'DISCOVER', title: 'Find the signal', body: 'Explore the Atlas, nearby drops, and the world layer without requiring a camera.', icon: '⌖' },
  { href: '/hunt', label: 'COLLECT', title: 'Walk the hunt', body: 'Move through stops, reserve a drop, then finish collection only after authoritative confirmation.', icon: '✦' },
  { href: '/marketplace', label: 'EARN', title: 'Trade the Vault', body: 'Move from owned collectibles into listings, offers, auctions, and verified ownership.', icon: '◇' },
  { href: '/trade', label: 'CONNECT', title: 'Tap to trade', body: 'Keep peer exchange separate from claim authority and on-chain ownership.', icon: '⇄' },
];

export default function PlayPage() {
  return (
    <main className="playRoot">
      <nav className="playNav">
        <Link className="brand" href="/">V<span>V</span>OXELVAULT</Link>
        <div className="links"><Link href="/discover">Discover</Link><Link href="/hunt">Hunt</Link><Link href="/marketplace">Marketplace</Link><Link href="/trade">Trade</Link></div>
        <Link className="wallet" href="/hunt">Start hunting →</Link>
      </nav>

      <section className="hero">
        <div className="eyebrow"><i /> WALK · DISCOVER · COLLECT · EARN</div>
        <h1>The Vault is <em>alive.</em></h1>
        <p>One clean game layer over the existing Voxel Vault: 3D objects, real-world discovery, durable reservations, verified chain ownership, and a marketplace underneath it all.</p>
        <div className="heroActions"><Link className="primary" href="/hunt">Enter a hunt</Link><Link className="secondary" href="/discover">Open the Atlas</Link></div>
      </section>

      <section className="lanes">
        {lanes.map((lane) => <Link className="lane" href={lane.href} key={lane.href}><span className="icon">{lane.icon}</span><div><div className="eyebrow">{lane.label}</div><h2>{lane.title}</h2><p>{lane.body}</p></div><span className="arrow">↗</span></Link>)}
      </section>

      <section className="pipeline">
        <div><div className="eyebrow">AUTHORITATIVE COLLECTION</div><h2>Signal → reservation → ownership.</h2><p>The browser can show distance as UX, but it cannot grant ownership. Production collection now expects a signed proximity proof, a durable reservation, a submitted transaction, a server-verified receipt, and atomic confirmation.</p></div>
        <div className="steps"><span><b>01</b>SIGNED PROXIMITY</span><span><b>02</b>DURABLE RESERVATION</span><span><b>03</b>SUBMITTED TX</span><span><b>04</b>VERIFIED RECEIPT</span><span><b>05</b>ATOMIC CONFIRM</span></div>
      </section>

      <section className="world">
        <div><div className="eyebrow">THE WORLD LAYER</div><h2>Camera optional.<br /><em>Wonder mandatory.</em></h2><p>AR can be a Peek. The core game is simply walking toward signals, discovering objects, and collecting them without turning the sidewalk into a camera audition.</p></div>
        <div className="orb"><span>VAULT<br />SIGNAL</span></div>
      </section>

      <footer><span>VOXEL VAULT · 3D COLLECTIBLES · REAL OWNERSHIP</span><Link href="/">Return to the Vault →</Link></footer>

      <style jsx>{`
        .playRoot{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow:hidden}.playRoot *{box-sizing:border-box}
        .playNav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,6,11,.86);backdrop-filter:blur(18px);position:sticky;top:0;z-index:10}.brand{font-size:17px;font-weight:950;letter-spacing:.15em;color:#fff;text-decoration:none}.brand span{color:#9b7cff}.links{display:flex;gap:24px}.links a{color:#9299ab;text-decoration:none;font-size:13px}.links a:hover{color:#fff}.wallet{border:1px solid rgba(255,255,255,.16);padding:10px 15px;border-radius:999px;color:#fff;text-decoration:none;font-size:12px;font-weight:850}
        .hero{max-width:1100px;margin:0 auto;padding:92px 5vw 58px}.eyebrow{font-size:10px;letter-spacing:.18em;color:#8f96a9;font-weight:900}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#55e6ff;box-shadow:0 0 14px #55e6ff;margin-right:8px}.hero h1{font-size:clamp(54px,9vw,110px);line-height:.88;margin:14px 0 20px;font-weight:950;letter-spacing:-.05em}.hero h1 em,.world h2 em{font-family:Georgia,serif;font-weight:400;color:#ad99ff}.hero p{max-width:700px;color:#a8aec0;line-height:1.7;font-size:16px}.heroActions{display:flex;gap:10px;margin-top:28px}.primary,.secondary{padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:850;font-size:13px}.primary{background:#fff;color:#05060b}.secondary{border:1px solid rgba(255,255,255,.16);color:#fff}
        .lanes{max-width:1100px;margin:0 auto;padding:0 5vw 80px;display:grid;grid-template-columns:1fr 1fr;gap:12px}.lane{min-height:190px;padding:24px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012));text-decoration:none;color:#fff;display:flex;gap:18px;position:relative;transition:.2s transform,.2s border-color}.lane:hover{transform:translateY(-3px);border-color:rgba(155,124,255,.45)}.icon{font-size:27px;color:#55e6ff}.lane h2{margin:7px 0 8px;font-size:25px}.lane p{color:#8f96a9;line-height:1.55;max-width:400px;font-size:13px}.arrow{position:absolute;right:20px;top:20px;color:#7d8496}
        .pipeline{max-width:1100px;margin:0 auto 80px;padding:28px;border-radius:24px;border:1px solid rgba(85,230,255,.18);background:radial-gradient(circle at 85% 20%,rgba(85,230,255,.08),transparent 35%),rgba(7,10,17,.9);display:grid;grid-template-columns:1.1fr .9fr;gap:35px}.pipeline h2{font-size:32px;margin:10px 0}.pipeline p{color:#9299ab;line-height:1.65;font-size:13px}.steps{display:grid;gap:8px;align-content:center}.steps span{display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.07);padding:10px 0;font-size:10px;letter-spacing:.1em;color:#a9afc0}.steps b{color:#55e6ff;font-size:10px}
        .world{max-width:1100px;margin:0 auto 70px;padding:20px 5vw 60px;display:grid;grid-template-columns:1fr 280px;align-items:center;gap:30px}.world h2{font-size:42px;line-height:1;margin:10px 0}.world p{max-width:600px;color:#9299ab;line-height:1.65}.orb{width:240px;height:240px;border-radius:50%;margin:auto;display:grid;place-items:center;text-align:center;border:1px solid rgba(155,124,255,.45);background:radial-gradient(circle at 35% 30%,rgba(85,230,255,.22),rgba(155,124,255,.08) 35%,transparent 65%),#090b14;box-shadow:0 0 80px rgba(155,124,255,.12),inset 0 0 50px rgba(85,230,255,.08);font-size:11px;letter-spacing:.18em;font-weight:900;color:#d9d2ff}
        footer{border-top:1px solid rgba(255,255,255,.08);padding:25px 5vw;display:flex;justify-content:space-between;color:#656c7d;font-size:9px;letter-spacing:.12em}footer a{color:#aeb4c5;text-decoration:none}
        @media(max-width:760px){.links{display:none}.hero{padding-top:64px}.lanes,.pipeline,.world{grid-template-columns:1fr}.lane{min-height:160px}.orb{width:190px;height:190px}.heroActions{flex-wrap:wrap}footer{gap:15px;flex-direction:column}}
      `}</style>
    </main>
  );
}

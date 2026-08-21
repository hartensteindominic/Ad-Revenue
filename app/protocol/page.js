'use client';

import QuantumVault from '../components/QuantumVault';
import { getEvolutionTiers } from '../../lib/evolution-engine';
import { quantumSecurityPosture } from '../../lib/quantum-research';

export default function ProtocolPage() {
  const tiers = getEvolutionTiers();
  const posture = quantumSecurityPosture();
  return (
    <main style={{ minHeight: '100vh', background: '#05060b', color: '#f7f8ff', padding: '28px 5vw 80px', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 50 }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: '.15em' }}>✦ V<span style={{ color: '#9b7cff' }}>V</span>OXELVAULT</a>
        <a href="/identity" style={{ color: '#bdb4ff', textDecoration: 'none', fontSize: 13 }}>Vault Identity →</a>
      </nav>
      <section style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#bdb4ff', fontWeight: 800 }}>THE PROTOCOL</div>
        <h1 style={{ fontSize: 'clamp(3.4rem,10vw,8rem)', lineHeight: .88, letterSpacing: '-.07em', maxWidth: 900, margin: '14px 0 24px' }}>The world becomes the inventory.</h1>
        <p style={{ maxWidth: 720, color: '#a7adbd', fontSize: 18, lineHeight: 1.7 }}>Voxel Vault is expanding from a marketplace into a spatial ownership protocol: collectibles, places, permissions, discovery and intelligence connected without pretending that simulated systems are already on-chain.</p>
        <div style={{ marginTop: 34 }}><QuantumVault /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 22 }}>
          {[
            ['SPATIAL', 'Rooms, locations, altitude and virtual anchors.'],
            ['EVOLUTION', 'Deterministic progression based on verifiable history.'],
            ['ACCESS', 'View, enter, collect, create and admin grants.'],
            ['INTELLIGENCE', 'AI planning with server-side provider boundaries.'],
            ['SETTLEMENT', 'Existing ETH and USD paths remain authoritative.'],
            ['RESEARCH', 'Quantum experiments and post-quantum readiness.'],
          ].map(([title, text]) => <article key={title} style={{ padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.025)' }}><b style={{ color: '#dcd6ff', fontSize: 11, letterSpacing: '.12em' }}>{title}</b><p style={{ color: '#9299ab', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></article>)}
        </div>
        <section style={{ marginTop: 60 }}><div style={{ fontSize: 11, letterSpacing: '.16em', color: '#bdb4ff', fontWeight: 800 }}>EVOLUTION PATH</div><div style={{ display: 'grid', gap: 8, marginTop: 16 }}>{tiers.map(tier => <div key={tier.tier} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 15px', borderBottom: '1px solid rgba(255,255,255,.07)' }}><span>{tier.tier}. {tier.name}</span><span style={{ color: '#7f879a', fontSize: 13 }}>{tier.holdDays}d · {tier.trades} trades · {tier.wisdom} wisdom · {tier.crossChainMiles} miles · {tier.sales} sales</span></div>)}</div></section>
        <section style={{ marginTop: 40, padding: 20, border: '1px solid rgba(255,255,255,.09)', borderRadius: 20 }}><b>Research posture</b><p style={{ color: '#9299ab' }}>{posture.note}</p></section>
      </section>
    </main>
  );
}

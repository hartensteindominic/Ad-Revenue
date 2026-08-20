'use client';

export default function GlobalError({ reset }) {
  return (
    <main style={{ minHeight: '100vh', background: '#05060b', color: '#f7f8ff', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif' }}>
      <section style={{ maxWidth: 520, textAlign: 'center' }}>
        <div style={{ color: '#9b84ff', fontSize: 11, letterSpacing: '.2em', fontWeight: 800 }}>VOXEL VAULT</div>
        <h1 style={{ fontSize: 42, margin: '14px 0' }}>The object universe hit a snag.</h1>
        <p style={{ color: '#9298aa', lineHeight: 1.7 }}>The page recovered its shell, but a 3D or data component failed. Try again before leaving the Vault.</p>
        <button onClick={() => reset()} style={{ marginTop: 12, border: 0, borderRadius: 999, padding: '13px 20px', fontWeight: 800, cursor: 'pointer' }}>Reload the Vault</button>
      </section>
    </main>
  );
}

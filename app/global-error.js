'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#05060b', color: '#f7f8ff', fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: 'min(560px,100%)', boxSizing: 'border-box', padding: 30, borderRadius: 24, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(12,14,24,.96)', boxShadow: '0 24px 90px rgba(0,0,0,.5)', textAlign: 'center' }}>
            <div style={{ color: '#9b84ff', fontSize: 11, letterSpacing: '.2em', fontWeight: 800 }}>VOXEL VAULT · RECOVERY</div>
            <h1 style={{ fontSize: 34, lineHeight: 1.05, margin: '14px 0' }}>The Vault hit a recoverable error.</h1>
            <p style={{ color: '#9298aa', lineHeight: 1.7, margin: '0 auto 22px' }}>The recovery shell is independent of the 3D viewer, so a client-side rendering failure does not leave the whole site blank.</p>
            <button type="button" onClick={() => reset()} style={{ border: 0, borderRadius: 999, padding: '13px 20px', background: '#8c6cff', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Reload the Vault</button>
          </section>
        </main>
      </body>
    </html>
  );
}

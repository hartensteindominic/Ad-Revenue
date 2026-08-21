export const metadata = { title: 'Terms | Voxel Vault' };

const sectionStyle = { marginTop: 28 };
const textStyle = { color: '#a4abbb', lineHeight: 1.7, fontSize: 13, margin: 0 };

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#070912', color: '#eef0f7', padding: '24px 18px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a href="/" style={{ color: '#9b7cff', textDecoration: 'none', fontSize: 13 }}>← Voxel Vault</a>
        <h1 style={{ fontSize: 42, margin: '28px 0 4px', letterSpacing: '-.04em' }}>Terms</h1>
        <p style={{ color: '#737c8f', fontSize: 12 }}>Last updated August 21, 2026.</p>
        <section style={sectionStyle}><h2>Using Voxel Vault</h2><p style={textStyle}>Voxel Vault is an evolving platform for discovering, viewing, collecting, creating, trading, and owning digital objects. Features may change as the platform grows.</p></section>
        <section style={sectionStyle}><h2>Digital ownership</h2><p style={textStyle}>A successful blockchain transaction may establish ownership according to the applicable smart contract. A preview, listing, reservation, or interface state is not proof of ownership by itself.</p></section>
        <section style={sectionStyle}><h2>Location</h2><p style={textStyle}>Location is optional. Nearby features may use device location. Precise location should not be treated as a public ownership record.</p></section>
        <section style={sectionStyle}><h2>Payments and blockchain</h2><p style={textStyle}>Blockchain transactions can be irreversible. Network fees, asset prices, availability, and transaction status can change. Verify transaction details before confirming.</p></section>
        <section style={sectionStyle}><h2>Creators and campaigns</h2><p style={textStyle}>Creators are responsible for content they publish. Sponsored campaigns must follow applicable laws and platform rules.</p></section>
        <section style={sectionStyle}><h2>Experimental software</h2><p style={textStyle}>Availability, generated content, 3D previews, AI features, and third-party services are not guaranteed.</p></section>
        <section style={sectionStyle}><h2>Updates</h2><p style={textStyle}>These terms may change as Voxel Vault develops. The current version will be published here.</p></section>
      </div>
    </main>
  );
}

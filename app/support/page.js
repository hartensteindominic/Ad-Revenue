export const metadata = {
  title: 'Support',
  description: 'Voxel Vault support and troubleshooting.',
};

const SUPPORT_ISSUES_URL = 'https://github.com/hartensteindominic/Voxel-Vault/issues/new/choose';

export default function SupportPage() {
  return (
    <main className="supportPage">
      <div className="supportShell">
        <a className="supportBack" href="/">← Voxel Vault</a>
        <p className="supportEyebrow">SUPPORT</p>
        <h1>Need a hand?</h1>
        <p className="supportLead">Voxel Vault is built around 3D discovery, collecting and wallet-powered ownership. If something behaves strangely, start here.</p>
        <div className="supportGrid">
          <article><b>Wallet problems</b><p>Make sure your wallet is on the network shown by the app. Never send a recovery phrase or private key to support.</p></article>
          <article><b>3D not loading</b><p>Passive gallery previews are intentionally lightweight. Open an object to request its interactive inspection view.</p></article>
          <article><b>Purchase or claim issue</b><p>Keep your transaction hash or checkout receipt. Do not repeatedly submit a transaction while the first one is still pending.</p></article>
          <article><b>Privacy request</b><p>Use the support request flow for questions about information held by Voxel Vault or eligible deletion requests.</p></article>
        </div>
        <div className="contact"><span>SUPPORT CONTACT</span><a href={SUPPORT_ISSUES_URL}>Open a Voxel Vault support request ↗</a><small>Support is handled through the public Voxel Vault support channel until a dedicated support mailbox is configured.</small></div>
        <footer><a href="/privacy">Privacy Policy</a><span>·</span><a href="/">Return to Vault</a></footer>
      </div>
      <style jsx>{`body{margin:0}.supportPage{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,system-ui,sans-serif;padding:calc(24px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom))}.supportShell{max-width:900px;margin:0 auto}.supportBack{display:inline-block;color:#b9a5ff;text-decoration:none;font-weight:800;margin-bottom:56px}.supportEyebrow{color:#9299b0;letter-spacing:.22em;font-size:11px;font-weight:900}.supportShell h1{font-size:clamp(52px,9vw,92px);line-height:.92;letter-spacing:-.06em;margin:10px 0 18px}.supportLead{font-size:20px;line-height:1.6;color:#b5bacb;max-width:720px}.supportGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:44px}.supportGrid article{border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:24px;background:linear-gradient(145deg,rgba(141,107,255,.08),rgba(255,255,255,.02));box-shadow:inset 0 1px rgba(255,255,255,.05)}.supportGrid b{font-size:18px}.supportGrid p{color:#aeb4c7;line-height:1.65}.contact{margin-top:28px;border:1px solid rgba(169,146,255,.24);border-radius:22px;padding:24px;background:rgba(141,107,255,.06);display:flex;flex-direction:column;gap:8px}.contact span{font-size:10px;letter-spacing:.2em;color:#9299b0;font-weight:900}.contact a{color:#d9d1ff;font-weight:900}.contact small{color:#777f93;line-height:1.5}.supportShell footer{display:flex;gap:10px;margin-top:60px}.supportShell footer a{color:#c9bcff}.supportShell footer span{color:#5e6475}@media(max-width:700px){.supportGrid{grid-template-columns:1fr}}`}</style>
    </main>
  );
}

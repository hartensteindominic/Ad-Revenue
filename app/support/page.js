import './support.css';

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
    </main>
  );
}

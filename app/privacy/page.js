import './privacy.css';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Voxel Vault privacy information and data choices.',
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <div className="legalShell">
        <a className="legalBack" href="/">← Voxel Vault</a>
        <p className="legalEyebrow">PRIVACY</p>
        <h1>Privacy Policy</h1>
        <p className="legalLead">Voxel Vault is designed to minimize data collection while providing 3D discovery, collecting, marketplace and scavenger-hunt features.</p>
        <section><h2>What we may process</h2><ul><li>Wallet addresses when you choose to connect a wallet or complete a blockchain action.</li><li>Transaction and collectible information needed to show ownership, purchases, claims and marketplace activity.</li><li>Information you voluntarily submit through support, creator or checkout flows.</li><li>Technical request information needed to secure and operate the service, such as timestamps, request metadata and limited diagnostics.</li><li>Payment information is handled by the payment provider rather than stored as raw card details by Voxel Vault.</li></ul></section>
        <section><h2>Why we use it</h2><p>We use information to operate the Vault, process requested transactions, prevent abuse, provide support, improve reliability, and maintain security. Browsing the public collection does not require an account.</p></section>
        <section><h2>Third parties</h2><p>Depending on which features you use, Voxel Vault may rely on infrastructure and service providers such as Vercel, Supabase, Stripe, blockchain RPC providers and decentralized storage providers. Their handling of information is governed by their own policies and the services they provide.</p></section>
        <section><h2>Wallets and blockchain data</h2><p>Blockchain transactions are public and may be permanently visible on the relevant network. Voxel Vault does not receive private keys or seed phrases from your wallet connection.</p></section>
        <section><h2>Choices and deletion</h2><p>You can browse without creating an account and disconnect a wallet at any time through your wallet software. For questions or eligible deletion requests involving information held by Voxel Vault, use the Support page.</p></section>
        <section><h2>Updates</h2><p>This policy may be updated as the product and its service providers evolve. The effective policy will be published here.</p></section>
        <footer><a href="/support">Support</a><span>·</span><a href="/">Return to Vault</a></footer>
      </div>
    </main>
  );
}

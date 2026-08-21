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
        <section><h2>What we may process</h2><ul><li>Wallet addresses when you choose to connect a wallet or complete a blockchain action.</li><li>Transaction and collectible information needed to show ownership, purchases, claims and marketplace activity.</li><li>Information you voluntarily submit through support, creator or checkout flows.</li><li>Technical request information needed to secure and operate the service, such as timestamps, request metadata and limited diagnostics.</li><li>Location information only when you explicitly start a location-based scavenger hunt and grant the requested permission.</li><li>Saved Vault items such as collectible titles and URLs can be stored locally on your device. These saved items are a device-level convenience and are not automatically uploaded to Voxel Vault.</li><li>Payment information is handled by the payment provider rather than stored as raw card details by Voxel Vault.</li></ul></section>
        <section><h2>Why we use it</h2><p>We use information to operate the Vault, process requested transactions, prevent abuse, provide support, improve reliability, and maintain security. Browsing the public collection does not require an account.</p></section>
        <section><h2>Third parties</h2><p>Depending on which features you use, Voxel Vault may rely on infrastructure and service providers such as Vercel, Supabase, Stripe, blockchain RPC providers and decentralized storage providers. Their handling of information is governed by their own policies and the services they provide.</p></section>
        <section><h2>Wallets and blockchain data</h2><p>Blockchain transactions are public and may be permanently visible on the relevant network. Voxel Vault does not receive private keys or seed phrases from your wallet connection.</p></section>
        <section><h2>Choices and deletion</h2><p>You can browse without creating an account and disconnect a wallet at any time through your wallet software. Saved Vault items can be removed from the device inside My Vault. For questions or eligible deletion requests involving information held by Voxel Vault, use the Support page. Public blockchain records cannot be edited or deleted by Voxel Vault.</p></section>
        <section><h2>Updates</h2><p>This policy may be updated as the product and its service providers evolve. The effective policy will be published here.</p></section>
        <footer><a href="/support">Support</a><span>·</span><a href="/">Return to Vault</a></footer>
      </div>
      <style>{`body{margin:0}.legalPage{min-height:100vh;background:#05060b;color:#f7f8ff;font-family:Inter,system-ui,sans-serif;padding:calc(24px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom))}.legalShell{max-width:820px;margin:0 auto}.legalBack{display:inline-block;color:#b9a5ff;text-decoration:none;font-weight:800;margin-bottom:56px}.legalEyebrow{color:#9299b0;letter-spacing:.22em;font-size:11px;font-weight:900}.legalShell h1{font-size:clamp(46px,8vw,84px);line-height:.95;letter-spacing:-.055em;margin:10px 0 20px}.legalLead{font-size:20px;line-height:1.6;color:#b5bacb}.legalShell section{margin-top:42px;padding-top:28px;border-top:1px solid rgba(255,255,255,.09)}h2{font-size:24px;margin:0 0 12px}.legalShell p,.legalShell li{color:#aeb4c7;line-height:1.7}.legalShell ul{padding-left:22px}.legalShell footer{display:flex;gap:10px;margin-top:60px}.legalShell footer a{color:#c9bcff}.legalShell footer span{color:#5e6475}`}</style>
    </main>
  );
}

export const metadata = { title: 'Privacy | Voxel Vault' };

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <div className="legalInner">
        <a href="/">← Voxel Vault</a>
        <h1>Privacy</h1>
        <p>Last updated August 21, 2026.</p>
        <section><h2>What we use</h2><p>Voxel Vault may process account, wallet, transaction, device, and gameplay information needed to operate the service. Optional location access powers nearby discovery when enabled.</p></section>
        <section><h2>Location</h2><p>Location is optional. Precise location is not intended to become an on-chain ownership record.</p></section>
        <section><h2>Third parties</h2><p>Blockchain networks, wallet providers, hosting, analytics, payments, storage, and other integrations may process information under their own policies.</p></section>
        <section><h2>Your choices</h2><p>You can deny location access and disconnect your wallet from the application.</p></section>
        <section><h2>Updates</h2><p>This notice may change as the platform grows. The current version will be published here.</p></section>
      </div>
      <style jsx>{`.legalPage{min-height:100vh;background:#070912;color:#eef0f7;padding:24px 18px}.legalInner{max-width:720px;margin:auto}.legalInner>a{color:#9b7cff;text-decoration:none;font-size:13px}.legalInner h1{font-size:42px;margin:28px 0 4px}.legalInner>p{color:#737c8f;font-size:12px}.legalInner section{margin-top:28px}.legalInner h2{font-size:17px;margin-bottom:7px}.legalInner section p{color:#a4abbb;line-height:1.7;font-size:13px;margin:0}`}</style>
    </main>
  );
}

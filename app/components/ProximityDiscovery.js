'use client';

import { useEffect, useState } from 'react';
import { discoverWithBluetooth, getProximityCapabilities } from '../../lib/proximityDiscovery';

export default function ProximityDiscovery() {
  const [capabilities, setCapabilities] = useState({ bluetooth: false, qr: true, nfc: false });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setCapabilities(getProximityCapabilities()), []);

  async function tryBluetooth() {
    if (!capabilities.bluetooth) {
      setStatus('Bluetooth is not available here. QR discovery remains available.');
      return;
    }
    setBusy(true);
    setStatus('Choose a nearby Voxel Vault beacon…');
    try {
      const discovery = await discoverWithBluetooth();
      setStatus(`Found ${discovery.dropId}. Wallet authorization still required.`);
    } catch (error) {
      setStatus(error?.message || 'Nearby discovery failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="proximityPanel" aria-live="polite">
      <div>
        <div className="eyebrow">PHYSICAL DISCOVERY</div>
        <h3>Find the signal. <em>Claim it later.</em></h3>
        <p>QR works as the dependable path. Supported browsers can enhance the experience with Bluetooth. Discovery identifies an item; it never grants ownership.</p>
      </div>
      <div className="proximityActions">
        <button type="button" onClick={tryBluetooth} disabled={busy}>
          {busy ? 'Scanning…' : capabilities.bluetooth ? '◉ Scan nearby with Bluetooth' : '◉ Bluetooth unavailable here'}
        </button>
        <span>QR: ready · NFC: {capabilities.nfc ? 'available' : 'optional enhancement'}</span>
      </div>
      {status && <small>{status}</small>}
      <style jsx>{`
        .proximityPanel{max-width:1400px;margin:0 auto;padding:0 5vw 36px;display:grid;grid-template-columns:1.3fr .7fr;gap:18px;align-items:center}.proximityPanel>div:first-child{padding:22px;border:1px solid rgba(85,230,255,.12);border-radius:18px;background:rgba(8,14,22,.7)}.proximityPanel h3{margin:0 0 8px;font-size:25px;letter-spacing:-.04em}.proximityPanel h3 em{font-style:normal;color:#55e6ff}.proximityPanel p{margin:0;color:#8f97aa;font-size:11px;line-height:1.7;max-width:720px}.proximityActions{display:grid;gap:9px}.proximityActions button{border:1px solid rgba(85,230,255,.25);background:rgba(85,230,255,.07);color:#d9fbff;padding:12px 14px;border-radius:12px;cursor:pointer;font-weight:800}.proximityActions button:disabled{opacity:.65;cursor:wait}.proximityActions span,.proximityPanel small{color:#737d92;font-size:9px;letter-spacing:.06em}.proximityPanel small{grid-column:1/-1}@media(max-width:760px){.proximityPanel{grid-template-columns:1fr;padding-left:16px;padding-right:16px}}
      `}</style>
    </div>
  );
}

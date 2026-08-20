'use client';

import { useState } from 'react';

/**
 * Bluetooth is a proximity signal, not an ownership rail.
 * Browsers cannot reliably perform phone-to-phone BLE handoffs, so Voxel Vault
 * uses QR/deep links as the universal fallback and BLE for compatible beacons.
 */
export default function ProximityBridge({ onSignal }) {
  const [status, setStatus] = useState('Bluetooth proximity is optional.');
  const [busy, setBusy] = useState(false);

  const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  async function scanNearby() {
    if (!supported) {
      setStatus('Bluetooth is not available here. Use the QR/deep-link handoff.');
      return;
    }
    if (!navigator.bluetooth?.requestDevice) {
      setStatus('This browser does not expose Web Bluetooth. Use QR/deep link.');
      return;
    }

    setBusy(true);
    try {
      // User gesture required. A generic BLE device can act as a physical
      // drop beacon; no private key or NFT ownership data is transmitted.
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      setStatus(`Nearby signal detected: ${device.name || 'Unnamed BLE device'}`);
      onSignal?.({
        transport: 'bluetooth',
        deviceName: device.name || null,
        deviceId: device.id || null,
        ownershipTransferred: false,
      });
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        setStatus('No nearby Bluetooth device selected.');
      } else {
        setStatus(error?.message || 'Bluetooth proximity check failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="proximityBridge" aria-label="Nearby Bluetooth mode">
      <div>
        <div className="proximityKicker">NEARBY MODE</div>
        <strong>Bluetooth signal</strong>
        <p>{status}</p>
      </div>
      <button type="button" onClick={scanNearby} disabled={busy}>
        {busy ? 'Scanning…' : 'Scan nearby'}
      </button>
      <style jsx>{`
        .proximityBridge{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;margin-top:18px;border:1px solid rgba(85,230,255,.16);border-radius:16px;background:rgba(85,230,255,.035);text-align:left}
        .proximityKicker{font-size:9px;letter-spacing:.16em;color:#55e6ff;font-weight:900;margin-bottom:4px}
        .proximityBridge strong{font-size:13px}.proximityBridge p{margin:4px 0 0;color:#7f879b;font-size:11px;line-height:1.4}
        .proximityBridge button{border:1px solid rgba(85,230,255,.3);background:#091018;color:#dffaff;border-radius:999px;padding:9px 13px;font-weight:850;white-space:nowrap;cursor:pointer}
        .proximityBridge button:disabled{opacity:.6;cursor:wait}
        @media(max-width:620px){.proximityBridge{align-items:flex-start;flex-direction:column}.proximityBridge button{width:100%}}
      `}</style>
    </section>
  );
}

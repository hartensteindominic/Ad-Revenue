/**
 * Voxel Vault physical-proximity helpers.
 *
 * Proximity is an interaction transport, never an ownership authority.
 * Web Bluetooth requires an explicit user gesture and browser permission.
 * QR/deep links remain the universal fallback.
 */

export function getProximityCapabilities() {
  const isBrowser = typeof window !== 'undefined';
  return {
    bluetooth: Boolean(isBrowser && navigator.bluetooth),
    nfc: Boolean(isBrowser && 'NDEFReader' in window),
    qr: true,
    deepLink: true,
  };
}

export function createProximityIntent({ dropId, action = 'discover', nonce } = {}) {
  if (!dropId || typeof dropId !== 'string') throw new Error('dropId is required');
  const value = {
    v: 1,
    kind: 'voxel-vault-proximity',
    action,
    dropId,
    nonce: nonce || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return value;
}

export function encodeDeepLink(intent) {
  const params = new URLSearchParams({
    v: String(intent.v || 1),
    action: intent.action || 'discover',
    drop: intent.dropId,
    nonce: intent.nonce,
  });
  return `${window.location.origin}/hunt?${params.toString()}`;
}

/** Must be called from a user gesture. Returns a BluetoothDevice or null. */
export async function requestBluetoothDevice({ serviceUuid } = {}) {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }
  if (!serviceUuid) throw new Error('serviceUuid is required');
  return navigator.bluetooth.requestDevice({
    filters: [{ services: [serviceUuid] }],
    optionalServices: [serviceUuid],
  });
}

/**
 * Bluetooth payloads may identify a nearby interaction, but callers must
 * exchange the resulting intent with the server and complete wallet/chain
 * authorization before treating a collectible as owned.
 */
export function parseProximityIntent(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid proximity payload');
  if (value.kind !== 'voxel-vault-proximity') throw new Error('Unknown proximity payload');
  if (!value.dropId || !value.nonce) throw new Error('Incomplete proximity payload');
  return {
    version: Number(value.v || 1),
    action: String(value.action || 'discover'),
    dropId: String(value.dropId),
    nonce: String(value.nonce),
    createdAt: value.createdAt || null,
  };
}

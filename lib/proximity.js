/**
 * Voxel Vault physical-proximity helpers.
 *
 * Proximity is an interaction transport, never an ownership authority.
 * QR/deep links are the universal path; Bluetooth/NFC are enhancements.
 */

const MAX_DROP_ID = 128;
const MAX_NONCE = 128;
const INTENT_TTL_MS = 5 * 60 * 1000;
const ALLOWED_ACTIONS = new Set(['discover', 'claim']);

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
  if (typeof dropId !== 'string' || !dropId.trim() || dropId.length > MAX_DROP_ID) {
    throw new Error('Invalid dropId');
  }
  if (!ALLOWED_ACTIONS.has(action)) throw new Error('Invalid proximity action');

  const generatedNonce = nonce || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null);
  if (!generatedNonce) throw new Error('Secure nonce generation is unavailable');

  return {
    v: 1,
    kind: 'voxel-vault-proximity',
    action,
    dropId: dropId.trim(),
    nonce: String(generatedNonce),
    createdAt: new Date().toISOString(),
  };
}

export function encodeDeepLink(intent) {
  const normalized = parseProximityIntent(intent);
  const params = new URLSearchParams({
    v: String(normalized.version),
    action: normalized.action,
    drop: normalized.dropId,
    nonce: normalized.nonce,
    ts: String(Date.parse(normalized.createdAt)),
  });
  return `${window.location.origin}/hunt?${params.toString()}`;
}

/** Must be called from a user gesture. Returns a BluetoothDevice or throws. */
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
 * Validate a proximity intent. Discovery payloads are untrusted input.
 * Server authorization and wallet/chain confirmation remain authoritative.
 */
export function parseProximityIntent(value, { now = Date.now(), maxAgeMs = INTENT_TTL_MS } = {}) {
  if (!value || typeof value !== 'object') throw new Error('Invalid proximity payload');
  if (value.kind !== 'voxel-vault-proximity') throw new Error('Unknown proximity payload');

  const version = Number(value.v || 1);
  if (version !== 1) throw new Error('Unsupported proximity payload version');
  if (!ALLOWED_ACTIONS.has(String(value.action || 'discover'))) throw new Error('Invalid proximity action');

  const dropId = String(value.dropId || '');
  const nonce = String(value.nonce || '');
  const createdAt = Date.parse(String(value.createdAt || ''));
  if (!dropId || dropId.length > MAX_DROP_ID) throw new Error('Invalid proximity dropId');
  if (!nonce || nonce.length > MAX_NONCE) throw new Error('Invalid proximity nonce');
  if (!Number.isFinite(createdAt)) throw new Error('Invalid proximity timestamp');
  if (createdAt > now + 30_000) throw new Error('Proximity payload timestamp is in the future');
  if (now - createdAt > maxAgeMs) throw new Error('Proximity payload has expired');

  return { version, action: String(value.action || 'discover'), dropId, nonce, createdAt: new Date(createdAt).toISOString() };
}

export const PROXIMITY_INTENT_TTL_MS = INTENT_TTL_MS;

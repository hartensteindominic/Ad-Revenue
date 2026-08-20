// Physical discovery is an identification layer only.
// Never use BLE/NFC/QR payloads as proof of ownership or as a substitute for wallet authorization.

export const VOXEL_VAULT_BLE_SERVICE = '9b2f2a0a-7b5b-4c18-8b75-0b4d4d0c0a01';
export const VOXEL_VAULT_BLE_CHARACTERISTIC = '9b2f2a0a-7b5b-4c18-8b75-0b4d4d0c0a02';
export const VOXEL_VAULT_BLE_NAME_PREFIX = 'VoxelVault';

const MAX_PAYLOAD_BYTES = 2048;

function clean(value, max = 120) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function validateDiscoveryPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Discovery payload is invalid.');
  const dropId = clean(payload.dropId, 96);
  const campaignId = clean(payload.campaignId, 96);
  if (!dropId) throw new Error('Discovery payload is missing a drop ID.');
  if (!campaignId) throw new Error('Discovery payload is missing a campaign ID.');

  return {
    dropId,
    campaignId,
    discoveryNonce: clean(payload.discoveryNonce, 128),
    source: clean(payload.source, 24) || 'physical',
    discoveredAt: new Date().toISOString(),
    ownership: 'not-authorized',
  };
}

export function getProximityCapabilities() {
  if (typeof window === 'undefined') return { bluetooth: false, qr: true, nfc: false };
  return {
    bluetooth: Boolean(navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function'),
    qr: true,
    nfc: Boolean('NDEFReader' in window),
  };
}

export function parseQrDiscovery(value) {
  const raw = clean(value, 2048);
  if (!raw) throw new Error('QR payload is empty.');

  try {
    const url = new URL(raw, window.location.origin);
    const dropId = clean(url.searchParams.get('drop'), 96);
    const campaignId = clean(url.searchParams.get('campaign'), 96);
    if (!dropId || !campaignId) throw new Error('QR code does not contain a Voxel Vault discovery payload.');
    return validateDiscoveryPayload({ dropId, campaignId, source: 'qr' });
  } catch (error) {
    if (error?.message?.includes('Voxel Vault discovery')) throw error;
    throw new Error('QR code is not a valid Voxel Vault discovery link.');
  }
}

export async function discoverWithBluetooth() {
  if (typeof window === 'undefined' || !navigator.bluetooth?.requestDevice) {
    const error = new Error('Bluetooth discovery is not supported in this browser. Use the QR discovery path.');
    error.code = 'BLUETOOTH_UNSUPPORTED';
    throw error;
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: VOXEL_VAULT_BLE_NAME_PREFIX }],
    optionalServices: [VOXEL_VAULT_BLE_SERVICE],
  });

  if (!device?.gatt) throw new Error('The nearby device does not expose a readable Voxel Vault service.');

  const server = await device.gatt.connect();
  try {
    const service = await server.getPrimaryService(VOXEL_VAULT_BLE_SERVICE);
    const characteristic = await service.getCharacteristic(VOXEL_VAULT_BLE_CHARACTERISTIC);
    const value = await characteristic.readValue();
    if (!value || value.byteLength > MAX_PAYLOAD_BYTES) throw new Error('Nearby payload is too large.');

    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const text = new TextDecoder().decode(bytes);
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error('Nearby payload is not valid JSON.');
    }

    return validateDiscoveryPayload({ ...payload, source: 'bluetooth' });
  } finally {
    try { device.gatt.disconnect(); } catch { /* device may already be disconnected */ }
  }
}

export function discoveryRequiresWallet(discovery) {
  return Boolean(discovery?.dropId && discovery?.campaignId);
}

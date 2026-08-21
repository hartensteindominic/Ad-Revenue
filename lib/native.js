import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';

const SAVED_VAULT_KEY = 'voxel_vault_saved_items_v1';
const MAX_SAVED_ITEMS = 50;

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function tapHaptic() {
  if (!isNativeApp()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are an enhancement, never a dependency of the web experience.
  }
}

export async function successHaptic() {
  if (!isNativeApp()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Ignore unsupported haptic hardware.
  }
}

export async function openNativeBrowser(url) {
  if (!url) return false;
  if (!isNativeApp()) {
    window.location.assign(url);
    return true;
  }
  try {
    await Browser.open({ url });
    return true;
  } catch {
    return false;
  }
}

export async function shareCurrentCollectible({ title = 'Voxel Vault', text = '', url } = {}) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  if (!shareUrl) return false;

  if (!isNativeApp()) {
    if (navigator?.share) {
      await navigator.share({ title, text, url: shareUrl });
      return true;
    }
    return false;
  }

  try {
    await Share.share({ title, text, url: shareUrl, dialogTitle: 'Share from Voxel Vault' });
    return true;
  } catch {
    return false;
  }
}

async function readSavedItems() {
  const { value } = await Preferences.get({ key: SAVED_VAULT_KEY });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_SAVED_ITEMS) : [];
  } catch {
    return [];
  }
}

export async function getSavedVaultItems() {
  return readSavedItems();
}

export async function saveCurrentCollectible({ title = 'Voxel Vault collectible', url, description = '' } = {}) {
  const itemUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  if (!itemUrl) return false;

  const items = await readSavedItems();
  const next = [
    { title, url: itemUrl, description, savedAt: new Date().toISOString() },
    ...items.filter((item) => item?.url !== itemUrl),
  ].slice(0, MAX_SAVED_ITEMS);

  await Preferences.set({ key: SAVED_VAULT_KEY, value: JSON.stringify(next) });
  await successHaptic();
  return true;
}

export async function removeSavedCollectible(url) {
  if (!url) return false;
  const items = await readSavedItems();
  const next = items.filter((item) => item?.url !== url);
  await Preferences.set({ key: SAVED_VAULT_KEY, value: JSON.stringify(next) });
  return true;
}

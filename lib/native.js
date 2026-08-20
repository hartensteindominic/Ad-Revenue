import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';

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

export async function shareVoxel({ name, url, text } = {}) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://voxel-vault.vercel.app');
  try {
    await Share.share({
      title: name || 'Voxel Vault collectible',
      text: text || `Explore ${name || 'this Voxel Vault collectible'}.`,
      url: shareUrl,
      dialogTitle: 'Share Voxel',
    });
    await successHaptic();
    return { ok: true };
  } catch (error) {
    if (error?.message?.toLowerCase?.().includes('cancel')) return { ok: false, cancelled: true };
    return { ok: false, error: error?.message || 'Share unavailable.' };
  }
}

export async function openInAppBrowser(url) {
  if (!url) return { ok: false, error: 'URL required.' };
  try {
    if (isNativeApp()) {
      await Browser.open({ url });
      return { ok: true, native: true };
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { ok: true, native: false };
    }
  } catch (error) {
    return { ok: false, error: error?.message || 'Browser unavailable.' };
  }
  return { ok: false, error: 'Browser unavailable.' };
}

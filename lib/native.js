import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

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

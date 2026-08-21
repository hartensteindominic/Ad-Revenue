import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voxelvault.app',
  appName: 'Voxel Vault',
  webDir: 'public',
  // Capacitor 7 removed bundledWebRuntime. Keep the native shell pointed at
  // the hosted Next.js app because this project uses server routes/API.
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://voxel-vault.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: true,
  },
};

export default config;

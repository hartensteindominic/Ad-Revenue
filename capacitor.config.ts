import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voxelvault.app',
  appName: 'Voxel Vault',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    // The current Next.js app is server-rendered and has API routes, so the
    // first native shell loads the stable hosted app rather than treating a
    // .next server bundle as a static Capacitor site.
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

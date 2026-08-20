import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voxelvault.app',
  appName: 'Voxel Vault',
  webDir: '.next',
  bundledWebRuntime: false,
  server: {
    // Native builds should point at a production web build only when the hosted
    // deployment is stable. Keep this unset for normal local builds.
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: true,
  },
};

export default config;

import CryptoAdSlot from './components/CryptoAdSlot';
import WalletBridge from './components/WalletBridge';
import './vault-fallback.css';
import './futuristic-vault.css';
import './ios-polish.css';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Voxel Vault | 3D Collectibles', template: '%s | Voxel Vault' },
  description: 'Discover, inspect, collect and create interactive 3D digital objects with real-world inspiration, distinctive materials and wallet-aware ownership.',
  keywords: ['3D collectibles','3D digital art','voxel art','3D marketplace','interactive collectibles','digital collectibles','3D models','GLB','GLTF','3D creators'],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
  applicationName: 'Voxel Vault',
  appleWebApp: { capable: true, title: 'Voxel Vault', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [{ url: '/voxel-vault-icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/voxel-vault-icon.svg' }],
  },
  openGraph: {
    title: 'Voxel Vault | 3D Collectibles',
    description: 'Explore original interactive 3D digital objects and discover the Vault.',
    type: 'website', url: SITE_URL, siteName: 'Voxel Vault',
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: 'Voxel Vault 3D digital objects' }],
  },
  twitter: { card: 'summary_large_image', title: 'Voxel Vault | 3D Collectibles', description: 'Interactive 3D digital objects for collectors and creators.', images: [`${SITE_URL}/api/og`] },
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#05060b' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<CryptoAdSlot slot="global"/><WalletBridge/></body></html>;
}

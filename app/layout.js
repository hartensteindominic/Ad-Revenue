import CryptoAdSlot from './components/CryptoAdSlot';
import WalletBridge from './components/WalletBridge';
import { WalletIdentityProvider } from './components/WalletIdentity';
import './vault-fallback.css';
import './futuristic-vault.css';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.voxelvault.io').replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Voxel Vault | Objects Worth Finding',
    template: '%s | Voxel Vault',
  },
  description: 'Walk, discover, collect and earn original 3D objects with verified digital ownership.',
  keywords: ['Voxel Vault','3D collectibles','objects worth finding','voxel art','3D digital objects','interactive NFTs','digital collectibles','3D creators','GLB NFT','GLTF NFT','Web3 art'],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Voxel Vault | Objects Worth Finding',
    description: 'Discover original 3D objects, explore what is around you, and collect with verified ownership.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Voxel Vault',
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: 'Voxel Vault objects worth finding' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Vault | Objects Worth Finding',
    description: 'Walk, discover, collect and earn original 3D objects.',
    images: [`${SITE_URL}/api/og`],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletIdentityProvider>
          {children}
          <CryptoAdSlot slot="global" />
          <WalletBridge />
        </WalletIdentityProvider>
      </body>
    </html>
  );
}

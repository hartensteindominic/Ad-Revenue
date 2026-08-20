import CryptoAdSlot from './components/CryptoAdSlot';
import WalletBridge from './components/WalletBridge';
import './vault-fallback.css';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Voxel Vault | The 3D NFT Marketplace',
    template: '%s | Voxel Vault',
  },
  description: 'Discover, inspect, collect and create interactive 3D digital objects with real-world inspiration, distinctive materials and real ownership.',
  keywords: ['3D NFT marketplace','3D digital art','voxel art','3D collectibles','interactive NFTs','digital collectibles','3D models','Web3 art','GLB NFT','GLTF NFT','3D creators','digital artifacts'],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Voxel Vault | The 3D NFT Marketplace',
    description: 'Explore original 3D digital objects inspired by reality and reimagined for collectors.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Voxel Vault',
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: 'Voxel Vault 3D digital objects' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Vault | The 3D NFT Marketplace',
    description: 'Interactive 3D digital objects for collectors and creators.',
    images: [`${SITE_URL}/api/og`],
  },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<CryptoAdSlot slot="global"/><WalletBridge/></body></html>;
}

import PremiumMarketplace from './components/PremiumMarketplace';
import CryptoAdSlot from './components/CryptoAdSlot';
import WalletBridge from './components/WalletBridge';

export const metadata = {
  title: 'Voxel Vault | The 3D NFT Marketplace',
  description: 'Discover, inspect, collect and create interactive 3D voxel assets.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app'),
  openGraph: {
    title: 'Voxel Vault | The 3D NFT Marketplace',
    description: 'Interactive 3D voxel NFTs for collectors, creators, games and VR.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Vault | The 3D NFT Marketplace',
    description: 'Interactive 3D voxel NFTs for collectors and creators.'
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<CryptoAdSlot slot="global"/><PremiumMarketplace/><WalletBridge/></body></html>;
}

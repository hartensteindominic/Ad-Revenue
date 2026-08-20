import MarketplaceLayer from './components/MarketplaceLayer';
import CryptoAdSlot from './components/CryptoAdSlot';

export const metadata = { title: 'VoxelVault', description: '3D asset marketplace' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<CryptoAdSlot slot="global"/><MarketplaceLayer /></body></html>;
}

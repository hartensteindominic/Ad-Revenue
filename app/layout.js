import MarketplaceLayer from './components/MarketplaceLayer';
import CryptoAdSlot from './components/CryptoAdSlot';
import WalletBridge from './components/WalletBridge';

export const metadata = { title: 'VoxelVault', description: '3D asset marketplace' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<WalletBridge /><CryptoAdSlot slot="global"/><MarketplaceLayer /></body></html>;
}

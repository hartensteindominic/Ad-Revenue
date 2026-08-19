import MarketplaceLayer from './components/MarketplaceLayer';

export const metadata = { title: 'VoxelVault', description: '3D asset marketplace' };
export default function RootLayout({ children }) { return <html lang="en"><body>{children}<MarketplaceLayer /></body></html>; }

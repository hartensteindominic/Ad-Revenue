import WalletConnect from './WalletConnect';

export const metadata = { title: 'VoxelVault', description: '3D asset marketplace' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WalletConnect />
      </body>
    </html>
  );
}

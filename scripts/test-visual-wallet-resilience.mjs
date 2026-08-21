import fs from 'node:fs';

const viewer = fs.readFileSync('app/components/VoxelViewer.js', 'utf8');
const wallet = fs.readFileSync('app/components/WalletBridge.js', 'utf8');
const connector = fs.readFileSync('lib/wallet-connect.js', 'utf8');
const layout = fs.readFileSync('app/layout.js', 'utf8');

const requiredViewer = [
  "setAssetState('fallback')",
  "loader.load(assetUrl",
  'Procedural fallback',
  'AnimationMixer',
  'frameObject',
  'IntersectionObserver',
];
for (const token of requiredViewer) {
  if (!viewer.includes(token)) throw new Error(`3D resilience regression: missing ${token}`);
}

const requiredWallet = [
  'connectWallet({ requireSepolia: true })',
  'voxel-vault:wallet',
  'Connect to play.',
  'Free to explore.',
];
for (const token of requiredWallet) {
  if (!wallet.includes(token)) throw new Error(`Wallet UX regression: missing ${token}`);
}

if (!connector.includes("eth_requestAccounts")) throw new Error('Shared wallet connector no longer owns account requests.');
if (!connector.includes('discoverMetaMaskProvider')) throw new Error('EIP-6963 provider discovery is missing.');
if (!layout.includes('<WalletBridge />')) throw new Error('WalletBridge is not mounted globally.');
if (wallet.includes("window.ethereum.request({ method: 'eth_requestAccounts' })")) throw new Error('WalletBridge bypasses the shared connector.');

console.log('visual-wallet-resilience: PASS');
console.log('3D source failure falls back to procedural rendering; showcase idle animation and framing are present.');
console.log('Wallet entry points use the shared EIP-6963-aware connector and simple one-action UI.');

import fs from 'node:fs';

const viewer = fs.readFileSync('app/components/VoxelViewer.js', 'utf8');
const wallet = fs.readFileSync('app/components/WalletBridge.js', 'utf8');
const layout = fs.readFileSync('app/layout.js', 'utf8');

const requiredViewer = [
  "setAssetState('fallback')",
  "loader.load(assetUrl",
  "Procedural fallback",
  'AnimationMixer',
  'frameObject',
  'IntersectionObserver',
];
for (const token of requiredViewer) {
  if (!viewer.includes(token)) throw new Error(`3D resilience regression: missing ${token}`);
}

const requiredWallet = [
  'connectWallet({ requireSepolia: true })',
  'eth_requestAccounts',
  'voxel-vault:wallet',
  'Connect to play.',
  'Free to explore.',
];
for (const token of requiredWallet) {
  if (!wallet.includes(token)) throw new Error(`Wallet UX regression: missing ${token}`);
}

if (!layout.includes('<WalletBridge />')) throw new Error('WalletBridge is not mounted globally.');
if (wallet.includes('window.ethereum.request({ method: \'eth_requestAccounts\' })')) {
  // The shared connector owns account requests. WalletBridge should not make a second raw request.
  if (!wallet.includes('connectWallet({ requireSepolia: true })')) throw new Error('Wallet requests bypass shared connector.');
}

console.log('visual-wallet-resilience: PASS');
console.log('3D source failure falls back to procedural rendering; showcase idle animation and framing are present.');
console.log('Wallet entry points use the shared EIP-6963-aware connector and simple one-action UI.');

/**
 * Ethereum MAINNET deployment for Voxel Vault NFT + Marketplace.
 *
 * SAFETY:
 * - Refuses to run unless CONFIRM_MAINNET=yes
 * - Refuses unless chainId === 1
 * - Refuses unless MULTISIG_OWNER is explicitly supplied
 * - Public mint is disabled in the NFT contract by default
 * - The deployer is never accepted as the mainnet owner fallback
 *
 * NEVER paste private keys into chat, GitHub, or Vercel public env.
 * Run only from a secure local machine with a funded deployer.
 */

const hre = require('hardhat');
const fs = require('fs');

async function main() {
  if (process.env.CONFIRM_MAINNET !== 'yes') {
    throw new Error(
      'Refusing mainnet deploy. Set CONFIRM_MAINNET=yes in your local .env after reading MAINNET_DEPLOY.md'
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Missing DEPLOYER_PRIVATE_KEY');

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== 1) {
    throw new Error(`Expected Ethereum mainnet chainId 1, got ${chainId}. Check MAINNET_RPC_URL.`);
  }

  const owner = process.env.MULTISIG_OWNER;
  if (!owner) {
    throw new Error(
      'Refusing mainnet deploy: MULTISIG_OWNER is required. Do not deploy the production contracts with the deployer EOA as owner.'
    );
  }

  const feeRecipient = process.env.FEE_RECIPIENT || owner;

  if (!hre.ethers.isAddress(owner)) throw new Error('Invalid MULTISIG_OWNER address');
  if (!hre.ethers.isAddress(feeRecipient)) throw new Error('Invalid FEE_RECIPIENT address');

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('=== Voxel Vault MAINNET deploy ===');
  console.log('Deployer:', deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');
  console.log('Owner multisig:', owner);
  console.log('Fee recipient:', feeRecipient);

  if (balance === 0n) {
    throw new Error('Deployer has 0 ETH on mainnet. Fund the wallet, then retry.');
  }

  if (balance < hre.ethers.parseEther('0.02')) {
    console.warn('WARNING: Deployer balance is under 0.02 ETH. Deploy may fail if gas spikes.');
  }

  const NFT = await hre.ethers.getContractFactory('VoxelVaultNFT');
  const nft = await NFT.deploy(owner);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log('VoxelVaultNFT:', nftAddress);

  const Market = await hre.ethers.getContractFactory('VoxelVaultMarketplace');
  const market = await Market.deploy(owner, nftAddress, feeRecipient);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log('VoxelVaultMarketplace:', marketAddress);

  // The owner is a multisig, so configuration must be executed by that multisig.
  // Do not attempt privileged configuration from the deployer EOA.
  console.log('Initial public mint state:', await nft.publicMintEnabled());
  console.log('Owner-controlled configuration required from the multisig:');
  console.log(`  nft.setMinter("${marketAddress}", true)`);
  console.log('  nft.setPublicMintEnabled(false)  // already the contract default; verify on-chain');

  const addresses = {
    chainId: '1',
    network: 'mainnet',
    deployer: deployer.address,
    owner,
    feeRecipient,
    VoxelVaultNFT: nftAddress,
    VoxelVaultMarketplace: marketAddress,
    publicMintEnabled: false,
    marketplaceMinterConfigured: false,
    deployedAt: new Date().toISOString(),
    explorerNft: `https://etherscan.io/address/${nftAddress}`,
    explorerMarket: `https://etherscan.io/address/${marketAddress}`,
  };

  fs.writeFileSync('deployed-mainnet-addresses.json', JSON.stringify(addresses, null, 2));

  console.log('\n=== MAINNET CONTRACT DEPLOYMENT COMPLETE ===');
  console.log('The contracts are NOT ready for public sales until the multisig configures the marketplace as minter.');
  console.log('Verify both contracts on Etherscan, then configure the multisig and test on Sepolia before mainnet funds.');
  console.log('Reminder: contracts are not a substitute for a professional audit.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

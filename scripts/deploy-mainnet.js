/**
 * Ethereum MAINNET deployment for Voxel Vault NFT + Marketplace.
 *
 * SAFETY:
 * - Refuses to run unless CONFIRM_MAINNET=yes
 * - Refuses unless chainId === 1
 * - Public mint DISABLED by default after deploy
 * - Prefer MULTISIG_OWNER + FEE_RECIPIENT (not the deployer hot wallet)
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

  const owner = process.env.MULTISIG_OWNER || process.env.OWNER_ADDRESS || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || owner;

  if (!process.env.MULTISIG_OWNER && !process.env.OWNER_ADDRESS) {
    console.warn(
      'WARNING: MULTISIG_OWNER not set — owner will be the deployer EOA. Prefer a multisig on mainnet.'
    );
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('=== Voxel Vault MAINNET deploy ===');
  console.log('Deployer:', deployer.address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');
  console.log('Owner:', owner);
  console.log('Fee recipient:', feeRecipient);

  if (balance === 0n) {
    throw new Error('Deployer has 0 ETH on mainnet. Fund the wallet, then retry.');
  }

  // ~0.05–0.2 ETH usually enough depending on gas; warn if very low
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

  // Configure minter + disable public mint when deployer is owner
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    const minterTx = await nft.setMinter(marketAddress, true);
    await minterTx.wait();
    console.log('Marketplace enabled as minter');

    // Mainnet default: public mint OFF (claim path should use minter or re-enable deliberately)
    const disablePublic = process.env.DISABLE_PUBLIC_MINT !== 'false';
    if (disablePublic) {
      const tx = await nft.setPublicMintEnabled(false);
      await tx.wait();
      console.log('Public mint DISABLED (mainnet default)');
    } else {
      console.warn('Public mint LEFT ENABLED because DISABLE_PUBLIC_MINT=false');
    }
  } else {
    console.log('Owner is not deployer.');
    console.log('From the owner multisig you must call:');
    console.log(`  nft.setMinter("${marketAddress}", true)`);
    console.log('  nft.setPublicMintEnabled(false)  // recommended');
  }

  const addresses = {
    chainId: '1',
    network: 'mainnet',
    deployer: deployer.address,
    owner,
    feeRecipient,
    VoxelVaultNFT: nftAddress,
    VoxelVaultMarketplace: marketAddress,
    publicMintEnabled: process.env.DISABLE_PUBLIC_MINT === 'false',
    deployedAt: new Date().toISOString(),
    explorerNft: `https://etherscan.io/address/${nftAddress}`,
    explorerMarket: `https://etherscan.io/address/${marketAddress}`,
  };

  fs.writeFileSync('deployed-mainnet-addresses.json', JSON.stringify(addresses, null, 2));

  console.log('\n=== MAINNET DEPLOY COMPLETE ===');
  console.log('NEXT_PUBLIC_EVM_CHAIN_ID=0x1');
  console.log('NEXT_PUBLIC_EVM_CHAIN_NAME=Ethereum');
  console.log('NEXT_PUBLIC_EVM_EXPLORER_URL=https://etherscan.io');
  console.log('NEXT_PUBLIC_VOXEL_NFT_ADDRESS=' + nftAddress);
  console.log('NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=' + marketAddress);
  console.log('\nSaved deployed-mainnet-addresses.json');
  console.log('Verify on Etherscan, then set Vercel production env and redeploy the app.');
  console.log('Reminder: contracts are not a substitute for a professional audit.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

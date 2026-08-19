const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Missing DEPLOYER_PRIVATE_KEY');
  console.log('Deploying from:', deployer.address);

  const NFT = await hre.ethers.getContractFactory('VoxelVaultNFT');
  const nft = await NFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  const Market = await hre.ethers.getContractFactory('VoxelVaultMarketplace');
  const market = await Market.deploy(deployer.address, nftAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();

  const transferTx = await nft.transferOwnership(marketAddress);
  await transferTx.wait();

  console.log('\nVoxel Vault Sepolia deployment complete');
  console.log('NEXT_PUBLIC_VOXEL_NFT_ADDRESS=' + nftAddress);
  console.log('NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=' + marketAddress);
  console.log('NFT owner is now marketplace:', marketAddress);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

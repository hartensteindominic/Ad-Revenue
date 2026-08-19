const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Missing DEPLOYER_PRIVATE_KEY');
  console.log('Deploying Voxel Vault to Ethereum Sepolia from:', deployer.address);

  const NFT = await hre.ethers.getContractFactory('VoxelVaultNFT');
  const nft = await NFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  const Market = await hre.ethers.getContractFactory('VoxelVaultMarketplace');
  const market = await Market.deploy(deployer.address, nftAddress, deployer.address);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();

  const minterTx = await nft.setMinter(marketAddress, true);
  await minterTx.wait();

  const network = await hre.ethers.provider.getNetwork();
  const addresses = {
    chainId: network.chainId.toString(),
    network: hre.network.name,
    deployer: deployer.address,
    VoxelVaultNFT: nftAddress,
    VoxelVaultMarketplace: marketAddress,
    feeRecipient: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));

  console.log('\nVoxel Vault Ethereum Sepolia deployment complete');
  console.log('NEXT_PUBLIC_VOXEL_NFT_ADDRESS=' + nftAddress);
  console.log('NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=' + marketAddress);
  console.log('NFT marketplace minter enabled:', marketAddress);
  console.log('Addresses saved to deployed-addresses.json');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

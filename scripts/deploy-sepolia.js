const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Missing DEPLOYER_PRIVATE_KEY');

  const network = await hre.ethers.provider.getNetwork();
  console.log('Network:', hre.network.name, 'chainId', network.chainId.toString());
  console.log('Deploying from:', deployer.address);

  const owner = process.env.MULTISIG_OWNER || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;

  const NFT = await hre.ethers.getContractFactory('VoxelVaultNFT');
  const nft = await NFT.deploy(owner);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  const Market = await hre.ethers.getContractFactory('VoxelVaultMarketplace');
  const market = await Market.deploy(owner, nftAddress, feeRecipient);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();

  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    const minterTx = await nft.setMinter(marketAddress, true);
    await minterTx.wait();
    console.log('Marketplace set as minter');

    // Public mint is opt-in, even on testnet. Keep it off for production-like deployments.
    if (process.env.ENABLE_PUBLIC_MINT === 'true') {
      const tx = await nft.setPublicMintEnabled(true);
      await tx.wait();
      console.log('Public mint explicitly enabled');
    }
  } else {
    console.log('Owner is not deployer — call setMinter(market, true) from the owner multisig');
  }

  const addresses = {
    chainId: network.chainId.toString(),
    network: hre.network.name,
    deployer: deployer.address,
    owner,
    feeRecipient,
    VoxelVaultNFT: nftAddress,
    VoxelVaultMarketplace: marketAddress,
    deployedAt: new Date().toISOString(),
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));

  console.log('\nDeployment complete');
  console.log('NEXT_PUBLIC_VOXEL_NFT_ADDRESS=' + nftAddress);
  console.log('NEXT_PUBLIC_VOXEL_MARKET_ADDRESS=' + marketAddress);
  console.log('Addresses saved to deployed-addresses.json');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

#!/usr/bin/env node
/**
 * Mint selected Voxel Vault editions from ipfs-manifest/token-uris.json.
 *
 * Required env:
 *   MAINNET_RPC_URL
 *   DEPLOYER_PRIVATE_KEY (must be the NFT contract owner or approved minter)
 *
 * Example:
 *   node scripts/mint_from_manifest.js --manifest ./ipfs-manifest/token-uris.json --start 1 --end 10
 */

const fs = require('fs');
const hre = require('hardhat');

const NFT_ADDRESS = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '0xC6eb3c79139DFDD09D566Ca0b6e2C4F173E1fbcd';
const ABI = [
  'function mintTo(address recipient,address royaltyReceiver,string uri,uint96 royaltyBps) returns (uint256)',
  'function owner() view returns (address)',
  'function minters(address) view returns (bool)'
];

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function main() {
  const manifestPath = arg('--manifest', './ipfs-manifest/token-uris.json');
  const start = Number(arg('--start', '1'));
  const end = Number(arg('--end', String(start)));
  const royaltyBps = Number(arg('--royalty-bps', '500'));
  const recipient = arg('--recipient', '');
  const royaltyReceiver = arg('--royalty-receiver', '');

  if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY is required');
  if (!process.env.MAINNET_RPC_URL) throw new Error('MAINNET_RPC_URL is required');
  if (!recipient || !royaltyReceiver) throw new Error('--recipient and --royalty-receiver are required');
  if (royaltyBps > 1500) throw new Error('Royalty exceeds the deployed contract limit of 1500 bps');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const provider = new hre.ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const nft = new hre.ethers.Contract(NFT_ADDRESS, ABI, wallet);
  const owner = await nft.owner();
  const approved = await nft.minters(wallet.address);

  if (owner.toLowerCase() !== wallet.address.toLowerCase() && !approved) {
    throw new Error(`Wallet ${wallet.address} is not authorized to mint`);
  }

  for (let token = start; token <= end; token += 1) {
    const uri = manifest[String(token)];
    if (!uri) throw new Error(`Missing URI for token ${token}`);
    console.log(`Minting #${token} -> ${uri}`);
    const tx = await nft.mintTo(recipient, royaltyReceiver, uri, royaltyBps);
    console.log(`  tx: ${tx.hash}`);
    await tx.wait();
  }

  console.log(`Minted requested range #${start} -> #${end}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

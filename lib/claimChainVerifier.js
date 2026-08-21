/**
 * Server-side verification of a claimed mint.
 * Never trust a client-provided tokenId, receipt, or ownership assertion.
 */
import { Contract, JsonRpcProvider, isAddress } from 'ethers';

const NFT_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'event VoxelMinted(uint256 indexed tokenId, address indexed creator, string tokenURI, uint96 royaltyBps)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function rpcUrl() {
  const url = process.env.EVM_RPC_URL || process.env.NEXT_PUBLIC_EVM_RPC_URL;
  if (!url) throw new Error('Authoritative EVM RPC is not configured');
  return url;
}

function nftAddress() {
  const address = process.env.VOXEL_NFT_ADDRESS || process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS;
  if (!address || !isAddress(address)) throw new Error('Authoritative NFT contract is not configured');
  return address;
}

function expectedChainId() {
  return BigInt(process.env.EVM_CHAIN_ID || process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '11155111');
}

export async function verifyClaimTransaction({ transactionHash, walletAddress, claimTicket }) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(transactionHash || ''))) throw new Error('Invalid transaction hash');
  if (!isAddress(walletAddress)) throw new Error('Invalid claimant wallet');
  if (!claimTicket) throw new Error('Claim ticket is required');

  const provider = new JsonRpcProvider(rpcUrl());
  const network = await provider.getNetwork();
  if (network.chainId !== expectedChainId()) throw new Error('Authoritative RPC is on the wrong chain');

  const tx = await provider.getTransaction(transactionHash);
  if (!tx) throw new Error('Transaction not found');
  if (!tx.to || tx.to.toLowerCase() !== nftAddress().toLowerCase()) throw new Error('Transaction target is not the Voxel Vault NFT contract');
  if (!tx.from || tx.from.toLowerCase() !== walletAddress.toLowerCase()) throw new Error('Transaction sender does not match claimant');

  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!receipt) throw new Error('Transaction receipt is not available yet');
  if (receipt.status !== 1) throw new Error('Mint transaction reverted');

  const nft = new Contract(nftAddress(), NFT_ABI, provider);
  const parsedTx = nft.interface.parseTransaction({ data: tx.data, value: tx.value });
  if (!parsedTx || parsedTx.name !== 'mint') throw new Error('Transaction is not the expected NFT mint call');

  const uri = String(parsedTx.args?.[0] || '');
  if (!uri.includes(claimTicket)) throw new Error('Claim ticket is not bound to the mint transaction');

  let tokenId = null;
  let transferFound = false;
  let mintFound = false;
  for (const log of receipt.logs || []) {
    if (log.address.toLowerCase() !== nftAddress().toLowerCase()) continue;
    if (log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && log.topics.length >= 4) {
      const from = `0x${log.topics[1].slice(-40)}`.toLowerCase();
      const to = `0x${log.topics[2].slice(-40)}`.toLowerCase();
      if (from === '0x0000000000000000000000000000000000000000' && to === walletAddress.toLowerCase()) {
        tokenId = BigInt(log.topics[3]).toString();
        transferFound = true;
      }
    }
    try {
      const parsed = nft.interface.parseLog(log);
      if (parsed?.name === 'VoxelMinted') {
        const eventTokenId = BigInt(parsed.args.tokenId).toString();
        if (eventTokenId === tokenId && String(parsed.args.tokenURI) === uri && String(parsed.args.creator).toLowerCase() === walletAddress.toLowerCase()) mintFound = true;
      }
    } catch {
      // Ignore unrelated logs emitted by the NFT contract.
    }
  }

  if (!transferFound || !tokenId) throw new Error('No verified mint Transfer event for the claimant');
  if (!mintFound) throw new Error('VoxelMinted event does not match the verified claimant mint');

  const owner = await nft.ownerOf(tokenId);
  if (owner.toLowerCase() !== walletAddress.toLowerCase()) throw new Error('On-chain owner does not match claimant');
  const tokenURI = await nft.tokenURI(tokenId);
  if (String(tokenURI) !== uri) throw new Error('On-chain token URI does not match the submitted mint');

  return {
    verified: true,
    transactionHash,
    tokenId,
    owner,
    contractAddress: nftAddress(),
    chainId: network.chainId.toString(),
    tokenURI,
  };
}

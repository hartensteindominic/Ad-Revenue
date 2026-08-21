/**
 * Server-only Ethereum receipt verifier for Voxel Vault claims.
 * A transaction hash and client-supplied tokenId are never trusted by themselves.
 */
import { Contract, Interface, JsonRpcProvider, getAddress, isAddress } from 'ethers';

const NFT_ABI = [
  'function mint(string uri,uint96 royaltyBps) returns (uint256)',
  'event VoxelMinted(uint256 indexed tokenId, address indexed creator, string tokenURI, uint96 royaltyBps)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

const ZERO = '0x0000000000000000000000000000000000000000';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function configuredChainId() {
  const raw = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '0xaa36a7';
  const value = BigInt(raw);
  if (value <= 0n) throw new Error('Invalid EVM chain ID');
  return value;
}

function configuredNftAddress() {
  const address = required('NEXT_PUBLIC_VOXEL_NFT_ADDRESS');
  if (!isAddress(address)) throw new Error('Invalid NFT contract address');
  return getAddress(address);
}

function provider() {
  return new JsonRpcProvider(required('SEPOLIA_RPC_URL'), Number(configuredChainId()));
}

/**
 * Verify that txHash is a successful mint from wallet to the configured NFT contract,
 * that the mint calldata contains this claim ticket, and that the emitted Transfer
 * sends the minted token to the same wallet.
 */
export async function verifyClaimTransaction({ transactionHash, walletAddress, claimTicket }) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(transactionHash || ''))) throw new Error('Invalid transaction hash');
  if (!isAddress(walletAddress)) throw new Error('Invalid wallet address');
  if (!claimTicket || String(claimTicket).length > 200) throw new Error('Invalid claim ticket');

  const wallet = getAddress(walletAddress);
  const nftAddress = configuredNftAddress();
  const chainId = configuredChainId();
  const rpc = provider();
  const network = await rpc.getNetwork();
  if (BigInt(network.chainId) !== chainId) throw new Error('RPC network does not match configured chain');

  const [tx, receipt] = await Promise.all([rpc.getTransaction(transactionHash), rpc.getTransactionReceipt(transactionHash)]);
  if (!tx || !receipt) return { verified: false, pending: true, reason: 'transaction_not_confirmed' };
  if (receipt.status !== 1) return { verified: false, pending: false, reason: 'transaction_reverted' };
  if (!tx.to || getAddress(tx.to) !== nftAddress) return { verified: false, reason: 'wrong_contract' };
  if (getAddress(tx.from) !== wallet) return { verified: false, reason: 'wrong_sender' };

  const iface = new Interface(NFT_ABI);
  let decoded;
  try {
    decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    return { verified: false, reason: 'not_a_voxel_mint_transaction' };
  }
  if (!decoded || decoded.name !== 'mint') return { verified: false, reason: 'not_a_voxel_mint_transaction' };
  const tokenUri = String(decoded.args[0]);
  if (!tokenUri.includes(claimTicket)) return { verified: false, reason: 'claim_ticket_not_bound_to_mint' };

  let tokenId = null;
  let mintEventFound = false;
  let recipientFound = false;
  for (const log of receipt.logs || []) {
    if (!log.address || getAddress(log.address) !== nftAddress) continue;
    if (log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && log.topics.length >= 4) {
      const from = getAddress(`0x${log.topics[1].slice(-40)}`);
      const to = getAddress(`0x${log.topics[2].slice(-40)}`);
      if (from === ZERO && to === wallet) {
        tokenId = BigInt(log.topics[3]).toString();
        recipientFound = true;
      }
    }
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'VoxelMinted') {
        const eventTokenId = BigInt(parsed.args[0]).toString();
        if (eventTokenId === tokenId && String(parsed.args[2]) === tokenUri) mintEventFound = true;
      }
    } catch {}
  }

  if (!recipientFound || !tokenId || !mintEventFound) return { verified: false, reason: 'required_mint_events_missing' };
  return {
    verified: true,
    chainId: chainId.toString(),
    transactionHash,
    contractAddress: nftAddress,
    walletAddress: wallet,
    tokenId,
    blockNumber: receipt.blockNumber,
  };
}

export async function assertClaimTransactionVerified(args) {
  const result = await verifyClaimTransaction(args);
  if (!result.verified) {
    const error = new Error(result.reason || 'Chain transaction not verified');
    error.pending = Boolean(result.pending);
    throw error;
  }
  return result;
}

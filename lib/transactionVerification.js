import { Interface, JsonRpcProvider, getAddress, isHexString } from 'ethers';

const MARKET_EVENT_ABI = [
  'event Sale(uint256 indexed tokenId,address indexed seller,address indexed buyer,uint256 price,uint256 royalty,uint256 fee)',
  'event OfferAccepted(uint256 indexed tokenId,address indexed buyer,uint256 amount)',
  'event AuctionSettled(uint256 indexed tokenId,address indexed winner,uint256 amount)',
];

const NFT_EVENT_ABI = [
  'event VoxelMinted(uint256 indexed tokenId,address indexed creator,string tokenURI,uint96 royaltyBps)',
  'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
];

const marketInterface = new Interface(MARKET_EVENT_ABI);
const nftInterface = new Interface(NFT_EVENT_ABI);

let providerCache = null;
let providerRpcUrl = null;

function getServerProvider() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL || process.env.RPC_URL;
  if (!rpcUrl) throw new Error('Server RPC is not configured');
  if (!providerCache || providerRpcUrl !== rpcUrl) {
    providerCache = new JsonRpcProvider(rpcUrl);
    providerRpcUrl = rpcUrl;
  }
  return providerCache;
}

function normalizeWallet(value) {
  return value ? getAddress(String(value).trim()) : null;
}

export async function verifyTransactionReceipt(txHash, { expectedChainId, expectedTo } = {}) {
  if (typeof txHash !== 'string' || !isHexString(txHash, 32)) throw new Error('Invalid transaction hash');

  const provider = getServerProvider();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (expectedChainId != null && chainId !== Number(expectedChainId)) {
    throw new Error(`Wrong chain: expected ${expectedChainId}, got ${chainId}`);
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { confirmed: false, reason: 'transaction_not_mined', chainId };
  if (receipt.status !== 1) {
    return { confirmed: false, reason: 'transaction_reverted', chainId, blockNumber: receipt.blockNumber };
  }

  if (expectedTo) {
    const expected = normalizeWallet(expectedTo);
    const actual = receipt.to ? normalizeWallet(receipt.to) : null;
    if (!actual || actual !== expected) {
      return { confirmed: false, reason: 'unexpected_contract', chainId, blockNumber: receipt.blockNumber };
    }
  }

  return {
    confirmed: true,
    chainId,
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
    to: receipt.to || null,
    from: receipt.from || null,
    logs: receipt.logs || [],
  };
}

export async function verifyMarketplaceSettlement(
  txHash,
  { expectedChainId, expectedTo, buyer, seller, tokenId } = {},
) {
  if (!expectedTo) throw new Error('Settlement contract is required');

  const receipt = await verifyTransactionReceipt(txHash, { expectedChainId, expectedTo });
  if (!receipt.confirmed) return { ...receipt, semanticSettlementVerified: false };

  const expectedContract = normalizeWallet(expectedTo);
  const expectedBuyer = normalizeWallet(buyer);
  const expectedSeller = normalizeWallet(seller);
  const expectedTokenId = tokenId == null || tokenId === '' ? null : String(tokenId);

  for (const log of receipt.logs) {
    if (!log.address || normalizeWallet(log.address) !== expectedContract) continue;
    try {
      const parsed = marketInterface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed) continue;

      const isSale = parsed.name === 'Sale';
      const isOfferAccepted = parsed.name === 'OfferAccepted';
      const isAuctionSettled = parsed.name === 'AuctionSettled';
      if (!isSale && !isOfferAccepted && !isAuctionSettled) continue;

      const buyerAddress = parsed.name === 'Sale'
        ? parsed.args.buyer
        : parsed.name === 'OfferAccepted'
          ? parsed.args.buyer
          : parsed.args.winner;
      const eventTokenId = parsed.args.tokenId != null ? String(parsed.args.tokenId) : null;

      if (expectedBuyer && normalizeWallet(buyerAddress) !== expectedBuyer) continue;
      if (expectedTokenId && eventTokenId !== expectedTokenId) continue;

      if (expectedSeller) {
        if (isSale) {
          if (normalizeWallet(parsed.args.seller) !== expectedSeller) continue;
        } else if (isOfferAccepted) {
          if (!receipt.from || normalizeWallet(receipt.from) !== expectedSeller) continue;
        } else {
          continue;
        }
      }

      return {
        ...receipt,
        semanticSettlementVerified: true,
        settlementEvent: parsed.name,
        tokenId: eventTokenId,
      };
    } catch {
      // Ignore unrelated or malformed logs from the same transaction.
    }
  }

  return { ...receipt, semanticSettlementVerified: false, reason: 'settlement_event_not_found' };
}

/**
 * Verify the actual NFT mint that completes a server-authorized scavenger-drop claim.
 * The mint path requires the claimant to be the transaction sender and requires the
 * server-issued ticket to appear in the VoxelMinted metadata URI.
 */
export async function verifyClaimSettlement(
  txHash,
  { expectedChainId, expectedTo, walletAddress, claimTicket, tokenId } = {},
) {
  if (!expectedTo) throw new Error('NFT settlement contract is required');
  if (!walletAddress) throw new Error('Claim wallet is required');
  if (!claimTicket) throw new Error('Claim ticket is required');

  const receipt = await verifyTransactionReceipt(txHash, { expectedChainId, expectedTo });
  if (!receipt.confirmed) return { ...receipt, claimSettlementVerified: false };

  const expectedContract = normalizeWallet(expectedTo);
  const expectedWallet = normalizeWallet(walletAddress);
  const expectedTokenId = tokenId == null || tokenId === '' ? null : String(tokenId);

  if (!receipt.from || normalizeWallet(receipt.from) !== expectedWallet) {
    return { ...receipt, claimSettlementVerified: false, reason: 'transaction_sender_mismatch' };
  }

  for (const log of receipt.logs) {
    if (!log.address || normalizeWallet(log.address) !== expectedContract) continue;
    try {
      const parsed = nftInterface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed || parsed.name !== 'VoxelMinted') continue;

      const eventTokenId = String(parsed.args.tokenId);
      const creator = normalizeWallet(parsed.args.creator);
      const tokenUri = String(parsed.args.tokenURI || '');

      if (creator !== expectedWallet) continue;
      if (expectedTokenId && eventTokenId !== expectedTokenId) continue;
      if (!tokenUri.includes(String(claimTicket))) continue;

      return {
        ...receipt,
        claimSettlementVerified: true,
        settlementEvent: parsed.name,
        tokenId: eventTokenId,
        walletAddress: expectedWallet,
      };
    } catch {
      // Ignore unrelated or malformed logs from the same transaction.
    }
  }

  return { ...receipt, claimSettlementVerified: false, reason: 'claim_mint_event_not_found' };
}

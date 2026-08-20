import { Interface, JsonRpcProvider, getAddress, isHexString } from 'ethers';

const MARKET_EVENT_ABI = [
  'event Sale(uint256 indexed tokenId,address indexed seller,address indexed buyer,uint256 price,uint256 royalty,uint256 fee)',
  'event OfferAccepted(uint256 indexed tokenId,address indexed buyer,uint256 amount)',
  'event AuctionSettled(uint256 indexed tokenId,address indexed winner,uint256 amount)',
];
const marketInterface = new Interface(MARKET_EVENT_ABI);

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

/**
 * Receipt success is not enough. This function requires a recognized marketplace
 * settlement event emitted by the configured contract and validates the expected
 * buyer, seller where the event can prove it, and optional token id.
 */
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
          // VoxelVaultMarketplace.acceptOffer is called by the NFT owner. The
          // receipt sender therefore proves the seller for this event shape.
          if (!receipt.from || normalizeWallet(receipt.from) !== expectedSeller) continue;
        } else {
          // AuctionSettled does not emit the seller and settleAuction may be
          // called by any account, so it cannot prove the expected seller.
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

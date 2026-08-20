import { Interface, JsonRpcProvider, getAddress, isHexString } from 'ethers';

const MARKET_EVENT_ABI = [
  'event Sale(uint256 indexed tokenId,address indexed seller,address indexed buyer,uint256 price,uint256 royalty,uint256 fee)',
  'event OfferAccepted(uint256 indexed tokenId,address indexed buyer,uint256 amount)',
  'event AuctionSettled(uint256 indexed tokenId,address indexed winner,uint256 amount)',
];
const marketInterface = new Interface(MARKET_EVENT_ABI);

export async function verifyTransactionReceipt(txHash, { expectedChainId, expectedTo } = {}) {
  if (typeof txHash !== 'string' || !isHexString(txHash, 32)) throw new Error('Invalid transaction hash');
  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL || process.env.RPC_URL;
  if (!rpcUrl) throw new Error('Server RPC is not configured');

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (expectedChainId != null && chainId !== Number(expectedChainId)) throw new Error(`Wrong chain: expected ${expectedChainId}, got ${chainId}`);

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { confirmed: false, reason: 'transaction_not_mined', chainId };
  if (receipt.status !== 1) return { confirmed: false, reason: 'transaction_reverted', chainId, blockNumber: receipt.blockNumber };

  if (expectedTo) {
    const expected = getAddress(expectedTo);
    const actual = receipt.to ? getAddress(receipt.to) : null;
    if (!actual || actual !== expected) return { confirmed: false, reason: 'unexpected_contract', chainId, blockNumber: receipt.blockNumber };
  }

  return { confirmed: true, chainId, blockNumber: receipt.blockNumber, transactionHash: receipt.hash, to: receipt.to || null, logs: receipt.logs || [] };
}

export async function verifyMarketplaceSettlement(txHash, { expectedChainId, expectedTo, buyer, seller } = {}) {
  const receipt = await verifyTransactionReceipt(txHash, { expectedChainId, expectedTo });
  if (!receipt.confirmed) return { ...receipt, semanticSettlementVerified: false };

  const expectedContract = getAddress(expectedTo);
  const expectedBuyer = buyer ? getAddress(buyer) : null;
  const expectedSeller = seller ? getAddress(seller) : null;

  for (const log of receipt.logs) {
    if (!log.address || getAddress(log.address) !== expectedContract) continue;
    try {
      const parsed = marketInterface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed) continue;
      const buyerAddress = parsed.name === 'Sale' ? parsed.args.buyer : parsed.name === 'OfferAccepted' ? parsed.args.buyer : parsed.args.winner;
      const sellerAddress = parsed.name === 'Sale' ? parsed.args.seller : null;
      if (expectedBuyer && getAddress(buyerAddress) !== expectedBuyer) continue;
      if (expectedSeller && sellerAddress && getAddress(sellerAddress) !== expectedSeller) continue;
      return {
        ...receipt,
        semanticSettlementVerified: true,
        settlementEvent: parsed.name,
        tokenId: parsed.args.tokenId != null ? String(parsed.args.tokenId) : null,
      };
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }

  return { ...receipt, semanticSettlementVerified: false, reason: 'settlement_event_not_found' };
}

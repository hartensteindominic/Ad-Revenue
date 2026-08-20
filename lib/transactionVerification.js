import { JsonRpcProvider, getAddress, isHexString } from 'ethers';

/**
 * Verify a transaction from a server-controlled RPC endpoint.
 * A successful receipt proves chain inclusion and execution, not semantic settlement.
 * Callers should provide the expected contract and, where applicable, verify events.
 */
export async function verifyTransactionReceipt(txHash, { expectedChainId, expectedTo } = {}) {
  if (typeof txHash !== 'string' || !isHexString(txHash, 32)) {
    throw new Error('Invalid transaction hash');
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL || process.env.RPC_URL;
  if (!rpcUrl) throw new Error('Server RPC is not configured');

  const provider = new JsonRpcProvider(rpcUrl);
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
    const expected = getAddress(expectedTo);
    const actual = receipt.to ? getAddress(receipt.to) : null;
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
  };
}

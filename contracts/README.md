# VoxelVault smart contract

`VoxelVault721.sol` is an ERC-721 contract intended for testnet deployment first.

## Deployment

Deploy with an OpenZeppelin-compatible Solidity tool such as Remix or Hardhat. The constructor requires the address that should own the minting permission.

After deployment, set the public Vercel environment variable:

`NEXT_PUBLIC_VOXELVAULT_CONTRACT_ADDRESS=<deployed contract address>`

Do **not** put a wallet private key in this variable or in client-side code.

The contract currently restricts `mint()` to its owner. That owner should be a deployment/admin wallet, not a user's browser wallet. A production version should move mint authorization to a safer minting architecture before mainnet.

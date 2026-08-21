# Voxel Vault real-world mint economy

## Core loop

Find a real-world object -> pay in USD -> receive/claim the physical item -> mint its digital twin -> scan QR -> preserve provenance -> resell/transfer.

## Payment rule

USD payment is the commerce event. Blockchain minting happens only after the payment is verified by the server/Stripe webhook. Never show an NFT as owned before the chain transaction confirms.

## Supported acquisition modes

- Physical + NFT
- NFT only
- Local pickup + NFT
- Delivery + NFT
- Merchant purchase + NFT
- Food/drink purchase + collectible receipt, where the merchant integration and local laws permit it

## History

Each completed purchase should produce an immutable event chain: order created, USD payment confirmed, physical fulfillment/pickup confirmed, QR identity issued, mint authorization issued, NFT transaction submitted, NFT transaction confirmed, and ownership transfer/resale events.

## Food / everyday commerce

Food is a category, not a special blockchain primitive. A participating restaurant/store can issue a collectible receipt after a verified purchase. The collectible can represent the meal, limited menu item, event, or merchant edition. The NFT represents the verified purchase/experience or collectible edition, not the physical food itself.

## Merchant integration

Use Stripe or another approved payment processor for USD. Merchant integrations must pass a verified order identifier to Voxel Vault. Never trust a client-supplied paid flag.

## Minting architecture

Stripe checkout -> signed webhook verification -> purchase record -> mint authorization -> wallet mint -> receipt/token record -> QR identity -> history.

For custodial or gas-sponsored minting, add an explicit server-side wallet policy and security review before enabling it. Default Voxel Vault behavior remains user-wallet minting on the configured EVM chain.

## Trust boundary

Payment proves the purchase. The blockchain proves the token ownership. The QR links the physical identity to the digital record. None of these should be represented as complete until the corresponding authoritative event is confirmed.

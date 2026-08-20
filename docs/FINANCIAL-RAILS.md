# Financial Rails

Voxel Vault should support crypto-native ownership while keeping payments modular.

## Crypto

- Wallet signs on-chain transactions.
- Marketplace contracts remain the source of truth for ownership, listings and settlement.
- Network, contract, token and recipient are shown before signing.

## Card / bank rails

Stripe can provide supported card and fiat payment flows where configured. A card purchase must settle through a server-verified payment session and only then trigger an eligible fulfillment/on-chain flow.

## Venmo / Cash App / bank apps

Do not pretend these are universal NFT rails. Integration depends on the provider's current APIs, account capabilities, terms and supported transaction types. Voxel Vault can expose shareable payment or checkout links where officially supported, but must never scrape, impersonate, or bypass those services.

## Conversion model

A future regulated/approved on-ramp can look like:

fiat payment -> payment provider -> crypto settlement or marketplace fulfillment -> on-chain ownership

The app should clearly label whether the user is buying an NFT, buying crypto, or paying a service fee. These are not interchangeable.

## Safety

No private keys. No silent transfers. No hidden fees. No fake confirmations. Every money movement gets an explicit confirmation screen and server-side verification.

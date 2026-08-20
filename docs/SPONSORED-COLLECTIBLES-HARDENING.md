# Sponsored Collectibles: Hardened Design

## Product concept

A sponsor can fund a collectible campaign where the collectible itself is the advertising surface. The object can be a 3D voxel asset, image, video, or other supported media.

The important product boundary is explicit sponsorship. Voxel Vault should never intentionally make a paid advertisement look unsponsored. The experience can still feel like collecting because the ad is genuinely owned as a collectible, but the sponsorship label and disclosure remain visible.

## Money flow

Sponsor funding is escrowed per campaign on-chain.

Default campaign allocation:

- 25% creator
- 35% collector rewards
- 20% platform
- 20% reserve

The contract calculates these splits with integer basis points. The frontend economics module uses BigInt integer cents. No floating-point arithmetic is used for campaign allocation or collector rewards.

## Ownership boundary

The sponsored collectible system follows the same Voxel Vault trust rule as the marketplace:

**Discovery -> server authorization -> wallet signature -> chain confirmation -> ownership**

A proximity signal, client event, analytics event, claim ticket, or arbitrary transaction hash is not ownership proof.

## Reservation boundary

Reservations are on-chain, nonce-bound, wallet-bound, and expire after 10 minutes. A campaign allows at most 10 outstanding reservations per wallet, with one collectible per reservation.

## Sponsor funding boundary

The sponsor is always `msg.sender` when creating a campaign. A caller cannot create a campaign while pretending to be another sponsor.

Campaign funds are isolated by campaign accounting. Unallocated campaign balance can only be withdrawn by that campaign's sponsor after completion or expiry and after reservations are cleared.

## Disclosure boundary

Every sponsored campaign requires a disclosure string. The disclosure is stored in campaign state and copied into token state at mint time.

The UI may style the disclosure attractively, but it must not hide or remove the sponsored designation.

## Analytics boundary

Client-side analytics are useful for product telemetry but are not financial settlement evidence. Claims, revenue, ownership, and campaign completion must be derived from authoritative server/database and blockchain records.

Do not store or sell precise user location, contacts, browsing history, device fingerprints, advertising IDs, or unrelated purchase history merely to improve sponsor reporting.

## Production gate

This feature remains a feature-branch integration until all of the following pass:

1. `npm test:sponsored`
2. `npm run chain:compile`
3. contract unit/invariant tests for reservation replay, expiry, split conservation, failed payouts, campaign surplus, and pause behavior
4. server-side claim/settlement verification
5. Vercel production build
6. Sepolia end-to-end test with real wallet signatures
7. independent smart-contract security review before mainnet funding

The first deployment should be deliberately small. The economic goal is to prove that sponsor-funded collectible ads can pay for their own distribution and gradually cover platform operating costs before scaling the pool.

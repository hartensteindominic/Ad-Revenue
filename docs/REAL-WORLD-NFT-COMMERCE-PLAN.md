# Real-World Purchase → NFT History

## Product rule
Every eligible Voxel Vault object has a digital identity. A real-world purchase can create or attach that identity, but the UI never claims on-chain ownership until the chain transaction is confirmed.

## Purchase loop
1. Discover a physical object.
2. Show 3D twin, creator, provenance, condition, price, pickup/delivery.
3. Pay in USD through Stripe.
4. Create a durable order and immutable purchase-history event from the verified payment webhook.
5. Reserve the physical object and its Voxel ID.
6. Mint or attach the NFT through the authoritative on-chain claim flow.
7. Store the chain transaction/hash and token identity.
8. Only after confirmed on-chain ownership, show the NFT as owned.
9. Physical pickup/delivery can use the QR identity to verify the object.
10. Future resale appends another verified event instead of overwriting history.

## Store / food receipts
A future merchant flow can issue a Voxel receipt after an eligible USD purchase. The receipt should prove the purchase event without storing unnecessary payment data. Food can be supported as a consumable collectible category: restaurant/cafe purchase → digital receipt collectible → optional limited NFT/memory badge. It should not falsely claim persistent ownership of the consumed food itself.

## Required states
- listed
- checkout_pending
- paid
- physical_reserved
- mint_pending
- mint_submitted
- mint_confirmed
- handoff_pending
- completed
- disputed
- refunded

## Security rules
- Stripe webhooks are the source of truth for payment fulfillment.
- Never mint from a client-side success redirect.
- Never trust a client-provided USD amount.
- Idempotency keys and unique purchase references prevent duplicate fulfillment.
- Never expose private pickup addresses before commitment.
- Never mark NFT ownership before confirmed chain state.
- Preserve purchase history as append-only events.
- Store only the minimum payment metadata needed for reconciliation.

## Revenue
Marketplace fees and creator royalties remain separate. Voxel Vault can charge a USD marketplace/service fee. NFT minting can be included in the purchase price or explicitly itemized, but users must always see the total USD amount before checkout.

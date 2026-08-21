# AI + USD + Auto-Collect Hardening

## AI

The canonical Universal Collectible engine remains the source of truth for Visual DNA. The AI layer plans and critiques assets but cannot silently change token identity or minting authority. Quality gates can reject weak plans and request bounded regeneration.

## USD

Prices are represented in integer cents. Client displays may show USD alongside crypto, but exchange rates must come from a trusted server-side source and should include a timestamp. Payment execution belongs on the server through the selected payment provider.

## Auto-collect

Proximity detection is a discovery trigger, not an unattended wallet transaction. The user must have a connected wallet and explicitly confirm the claim. A cooldown and distance check reduce repeated triggers. The contract remains authoritative for ownership.

## Sponsored campaigns

Sponsored content is always disclosed. Revenue splits are stored as basis points and calculated transparently. Actual payouts require a server-side payment/ledger integration and appropriate legal/compliance review before launch.

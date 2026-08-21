# Vault Identity QA

## Functional

- `/identity` loads without a wallet.
- A connected wallet receives a deterministic `VAULT-XXXXXX` identity.
- Identity data is scoped by wallet address.
- XP, Energy, discoveries, missions, expeditions, travel, rare and mythic counters remain non-negative.
- Level and title are deterministic from XP.
- Local progression survives reloads when localStorage is available.
- Wallet ownership remains separate from gameplay progression.

## Trust

- No automatic transaction signing.
- No claim is minted by the identity page.
- Demo/local progression is explicitly labeled.
- Energy is presented as a gameplay resource, not cryptocurrency mining.

## UX

- Mobile layout collapses to one column.
- Identity ID is readable at small widths.
- Stats are scannable without paragraphs of copy.
- Artifact animation/decorative layers do not block interaction.

## Release gate

- `npm run test:identity`
- `npm run test:rewards`
- `npm run test:universal`
- `npm run test:media`
- `npm run test:mobile`
- `npm run build`
- dependency audit
- Vercel preview deployment
- browser smoke test of `/identity`

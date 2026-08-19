# DealRadar 🛰️

DealRadar is a GitHub Pages-friendly deal-intelligence website designed to grow into an automated affiliate revenue asset.

## MVP

- Searchable deal catalog
- Deal Score based on current vs typical price, discount depth and freshness
- Category quick filters
- Sort by deal score, discount or price
- Price-watch interface using localStorage
- Mobile-first responsive UI
- SEO-friendly static foundation
- Clearly labeled demo data so the site does not pretend to have live prices
- Monetization placeholders for approved ads and affiliate links

## Revenue model

1. **Affiliate commissions:** connect legitimate merchant/product feeds and approved affiliate programs.
2. **Display ads:** add approved ad-network code after the site has useful original content and meets the network's policies.
3. **Price alerts:** later add an optional paid tier for server-backed alerts and saved tracking.
4. **Sponsored deals:** allow clearly labeled sponsored placements once there is meaningful traffic.

## Architecture direction

The MVP intentionally runs as static HTML/CSS/JavaScript. The next phase should add a data-provider layer rather than hard-coding a retailer or relying on unauthorized scraping. A provider adapter can normalize product, price, availability, merchant and affiliate-link data into the format consumed by the front end.

Suggested future structure:

```text
/data/providers/       approved product-feed adapters
/data/normalize.js     normalized product schema
/scoring/              deal-score calculations
/alerts/               email/web-push alert service
/pages/deals/          indexable category/product pages
/admin/                feed health and revenue analytics
```

## Important launch rules

- Do not publish a price as live unless a connected source confirms it.
- Do not use retailer scraping that violates the retailer's terms.
- Replace all demo merchant URLs/data with approved sources before monetization.
- Clearly disclose affiliate relationships.
- Verify prices and availability on the merchant site before purchase.
- Add privacy, terms, affiliate disclosure and contact pages before scaling traffic.

## Deployment

The site is designed for GitHub Pages. Enable Pages from the repository's `main` branch root after merging the MVP branch.

## Roadmap

- [x] DealRadar visual MVP
- [x] Search and category filters
- [x] Deal scoring
- [x] Local price-watch prototype
- [ ] Connect approved product/affiliate feed
- [ ] Store historical price observations
- [ ] Generate price-history charts
- [ ] Build automated deal ingestion
- [ ] Add email price alerts
- [ ] Add indexable category/product pages
- [ ] Add analytics and affiliate conversion tracking
- [ ] Add premium alert tier

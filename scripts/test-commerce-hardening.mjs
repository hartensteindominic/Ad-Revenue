import fs from 'node:fs';

const catalog = fs.readFileSync('lib/catalog.js', 'utf8');
const checkout = fs.readFileSync('app/api/physical-nft-checkout/route.ts', 'utf8');
const webhook = fs.readFileSync('app/api/stripe/webhook/route.ts', 'utf8');
const verify = fs.readFileSync('app/api/mint-verify/route.ts', 'utf8');
const fulfillment = fs.readFileSync('lib/fulfillment.js', 'utf8');

const required = [
  ['catalog source URLs', /sourceUrl:/g, catalog],
  ['catalog reality basis', /realityBasis:/g, catalog],
  ['checkout fulfillment gate', /FULFILLMENT_NOT_READY/g, checkout],
  ['shipping address collection', /shipping_address_collection/g, checkout],
  ['Stripe webhook signature verification', /constructEvent/g, webhook],
  ['durable physical order lookup', /physical_orders/g, webhook],
  ['fulfillment idempotency key', /Idempotency-Key/g, fulfillment],
  ['Shopify order creation support', /orderCreate/g, fulfillment],
  ['physical order required before mint verification', /maybeSingle/g, verify],
];

for (const [label, pattern, source] of required) {
  if (!pattern.test(source)) throw new Error(`Missing commerce hardening: ${label}`);
}

const sourceCount = (catalog.match(/sourceUrl:/g) || []).length;
const realityCount = (catalog.match(/realityBasis:/g) || []).length;
if (sourceCount < 8 || realityCount !== sourceCount) throw new Error(`Catalog provenance mismatch: ${sourceCount} sources / ${realityCount} reality records`);

console.log(`Commerce hardening smoke test passed: ${sourceCount} source-verified products`);

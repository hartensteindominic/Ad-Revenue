# Voxel Vault dropship revenue setup

Physical checkout is deliberately fail-closed until a real fulfillment mapping exists for the exact SKU.

## Revenue model

- `VOXEL_MARKUP_PERCENT` controls the store markup. Default: `25`.
- The customer pays the supplier cost plus that markup, plus the configured NFT fee.
- The checkout records the supplier cost and gross merchandise margin in Stripe metadata.
- No Stripe Connect application fee or transfer split is created by the physical checkout route, so the payment belongs to the Stripe account configured for this Voxel Vault project. Stripe processing fees, refunds, taxes, shipping costs, supplier costs, and other business expenses still reduce net profit.

## Supplier mapping

Configure `VOXEL_FULFILLMENT_CATALOG` as JSON in the Vercel production environment. Each entry must point to a real fulfillment SKU and include its supplier cost.

Example:

```json
{
  "my-supplier-product": {
    "provider": "generic",
    "sku": "SUPPLIER-SKU-123",
    "costUsd": 18.50
  }
}
```

For Shopify fulfillment, use:

```json
{
  "my-supplier-product": {
    "provider": "shopify",
    "variantId": "gid://shopify/ProductVariant/123456789",
    "costUsd": 18.50
  }
}
```

The checkout will refuse to sell a physical item when `costUsd` is missing. This prevents the storefront from guessing a supplier cost from a public retail page and accidentally destroying the intended margin.

## Important sourcing rule

A product page proves that an item exists. It does **not** prove that Voxel Vault has permission to resell it, use its branding, or use a third-party 3D model in a commercial NFT. Only connect suppliers and 3D assets that you are authorized to use commercially.

The storefront can display a published third-party 3D viewer for product inspection, while the mintable NFT experience uses Voxel Vault's own native 3D twin engine.

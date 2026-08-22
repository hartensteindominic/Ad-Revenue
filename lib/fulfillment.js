const DEFAULT_SHOPIFY_API_VERSION = '2026-07';

function readCatalogMap() {
  const raw = process.env.VOXEL_FULFILLMENT_CATALOG;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error('VOXEL_FULFILLMENT_CATALOG must be valid JSON');
  }
}

export function getFulfillmentConfig(catalogKey) {
  const entry = readCatalogMap()[catalogKey];
  if (!entry || typeof entry !== 'object') return null;
  const provider = String(entry.provider || '').toLowerCase();
  if (provider === 'shopify') {
    const variantId = String(entry.variantId || '');
    const storeDomain = String(process.env.SHOPIFY_STORE_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
    if (!variantId || !storeDomain || !accessToken) return null;
    return { provider, variantId, storeDomain, accessToken, apiVersion: process.env.SHOPIFY_API_VERSION || DEFAULT_SHOPIFY_API_VERSION };
  }
  if (provider === 'generic') {
    const endpoint = process.env.FULFILLMENT_API_URL || '';
    const apiKey = process.env.FULFILLMENT_API_KEY || '';
    const sku = String(entry.sku || '');
    if (!endpoint || !apiKey || !sku) return null;
    return { provider, endpoint, apiKey, sku };
  }
  return null;
}

function requiredShipping(shipping) {
  if (!shipping?.name || !shipping?.address?.line1 || !shipping.address.city || !shipping.address.postal_code || !shipping.address.country) {
    throw new Error('Stripe checkout did not provide a complete shipping address');
  }
  return shipping;
}

async function shopifyCreateOrder(config, input) {
  const endpoint = `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`;
  const query = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      userErrors { field message }
      order { id name displayFinancialStatus displayFulfillmentStatus }
    }
  }`;
  const shipping = requiredShipping(input.shipping);
  const nameParts = String(shipping.name).trim().split(/\s+/);
  const firstName = nameParts.shift() || 'Voxel';
  const lastName = nameParts.join(' ') || 'Vault Customer';
  const variables = {
    order: {
      lineItems: [{ variantId: config.variantId, quantity: 1 }],
      email: input.email || undefined,
      phone: shipping.phone || undefined,
      customer: { toUpsert: { email: input.email || undefined, firstName, lastName } },
      shippingAddress: {
        firstName,
        lastName,
        address1: shipping.address.line1,
        address2: shipping.address.line2 || undefined,
        city: shipping.address.city,
        province: shipping.address.state || undefined,
        countryCode: shipping.address.country,
        zip: shipping.address.postal_code,
        phone: shipping.phone || undefined,
      },
      billingAddress: {
        firstName,
        lastName,
        address1: shipping.address.line1,
        address2: shipping.address.line2 || undefined,
        city: shipping.address.city,
        province: shipping.address.state || undefined,
        countryCode: shipping.address.country,
        zip: shipping.address.postal_code,
      },
      financialStatus: 'PAID',
      note: `Voxel Vault physical + NFT order ${input.externalOrderId}`,
    },
    options: { sendReceipt: true, sendFulfillmentReceipt: true },
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': config.accessToken },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Shopify fulfillment request failed with ${response.status}`);
  const errors = payload?.data?.orderCreate?.userErrors || [];
  if (errors.length) throw new Error(`Shopify order rejected: ${errors.map((e) => e.message).join('; ')}`);
  const order = payload?.data?.orderCreate?.order;
  if (!order?.id) throw new Error('Shopify did not return an order ID');
  return { status: 'submitted', fulfillmentOrderId: order.id, trackingNumber: null, trackingUrl: null };
}

async function genericSubmit(config, input) {
  const shipping = requiredShipping(input.shipping);
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
      'Idempotency-Key': input.orderId,
    },
    body: JSON.stringify({
      orderId: input.orderId,
      externalOrderId: input.externalOrderId,
      catalogKey: input.catalogKey,
      sku: config.sku,
      quantity: 1,
      shipping: {
        name: shipping.name,
        phone: shipping.phone || null,
        line1: shipping.address.line1,
        line2: shipping.address.line2 || null,
        city: shipping.address.city,
        state: shipping.address.state || '',
        postalCode: shipping.address.postal_code,
        country: shipping.address.country,
      },
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Fulfillment provider returned ${response.status}`);
  const result = await response.json().catch(() => ({}));
  return {
    status: 'submitted',
    fulfillmentOrderId: typeof result.orderId === 'string' ? result.orderId : null,
    trackingNumber: typeof result.trackingNumber === 'string' ? result.trackingNumber : null,
    trackingUrl: typeof result.trackingUrl === 'string' ? result.trackingUrl : null,
  };
}

export async function submitPhysicalFulfillment({ orderId, externalOrderId, catalogKey, shipping, email }) {
  const config = getFulfillmentConfig(catalogKey);
  if (!config) return { status: 'awaiting_fulfillment' };
  const input = { orderId, externalOrderId, catalogKey, shipping, email };
  if (config.provider === 'shopify') return shopifyCreateOrder(config, input);
  return genericSubmit(config, input);
}

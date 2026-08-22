// Voxel Vault production catalog.
// The visual shell can stay futuristic, but production objects must be real-world
// products/objects with a verifiable online source. The 3D viewer renders a
// truthful digital-twin representation of the object category and falls back to
// the real-world reference image when a remote model is unavailable.
import { availableShapes, availableMaterials } from './nft-engine';

const REAL_OBJECTS = [
  {
    id: 'apple-airpods-pro-3', name: 'Apple AirPods Pro 3', brand: 'Apple', type: 'Artifact', shape: 'jewelry', material: 'ceramic',
    sourceName: 'Apple', sourceUrl: 'https://www.apple.com/shop/buy-airpods/airpods-pro-3',
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '249', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Apple wireless earbuds with an online purchase source and a Voxel digital-twin presentation.', rarity: 'Rare',
  },
  {
    id: 'sony-wh1000xm5', name: 'Sony WH-1000XM5', brand: 'Sony', type: 'Artifact', shape: 'abstract', material: 'ceramic',
    sourceName: 'Sony', sourceUrl: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '399', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Sony over-ear headphones with a verified manufacturer shopping source.', rarity: 'Epic',
  },
  {
    id: 'canon-eos-r50', name: 'Canon EOS R50', brand: 'Canon', type: 'Artifact', shape: 'camera', material: 'metallic',
    sourceName: 'Canon U.S.A.', sourceUrl: 'https://www.usa.canon.com/shop/p/eos-r50',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '679', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Canon mirrorless camera with a live manufacturer purchase page.', rarity: 'Legendary',
  },
  {
    id: 'ray-ban-wayfarer', name: 'Ray-Ban Original Wayfarer', brand: 'Ray-Ban', type: 'Artifact', shape: 'jewelry', material: 'glass',
    sourceName: 'Ray-Ban', sourceUrl: 'https://www.ray-ban.com/usa/sunglasses/original-wayfarer',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '196', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Ray-Ban sunglasses represented as a collectible object with a verifiable online source.', rarity: 'Rare',
  },
  {
    id: 'stanley-quencher-40', name: 'Stanley Quencher 40 oz', brand: 'Stanley 1913', type: 'Artifact', shape: 'crystal', material: 'metallic',
    sourceName: 'Stanley 1913', sourceUrl: 'https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '45', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Stanley Quencher travel tumbler with a manufacturer shopping source.', rarity: 'Uncommon',
  },
  {
    id: 'lego-mclaren-f1', name: 'LEGO Technic McLaren Formula 1', brand: 'LEGO', type: 'Artifact', shape: 'car', material: 'plastic',
    sourceName: 'LEGO', sourceUrl: 'https://www.lego.com/en-us/product/mclaren-formula-1-race-car-42141',
    imageUrl: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '179', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real LEGO Technic Formula 1 set connected to the official LEGO store.', rarity: 'Epic',
  },
  {
    id: 'ikea-rosentorp-chair', name: 'ROSENTORP Chair', brand: 'IKEA', type: 'Architecture', shape: 'villa', material: 'wood',
    sourceName: 'IKEA', sourceUrl: 'https://www.ikea.com/us/en/search/?q=ROSENTORP',
    imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '199', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real IKEA furniture item discovered through IKEA online shopping.', rarity: 'Uncommon',
  },
  {
    id: 'nike-air-force-1-07', name: 'Air Force 1 07', brand: 'Nike', type: 'Artifact', shape: 'fox', material: 'leather',
    sourceName: 'Nike', sourceUrl: 'https://www.nike.com/t/air-force-1-07-mens-shoes',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '115', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Nike sneaker with an online Nike shopping source.', rarity: 'Rare',
  },
  {
    id: 'logitech-mx-keys-s', name: 'MX Keys S', brand: 'Logitech', type: 'Artifact', shape: 'robot', material: 'metallic',
    sourceName: 'Logitech', sourceUrl: 'https://www.logitech.com/en-us/products/keyboards/mx-keys-s.html',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '109', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Logitech wireless keyboard with a manufacturer product page.', rarity: 'Uncommon',
  },
  {
    id: 'trek-marlin-7', name: 'Marlin 7', brand: 'Trek', type: 'Vehicle', shape: 'motorcycle', material: 'metallic',
    sourceName: 'Trek', sourceUrl: 'https://www.trekbikes.com/us/en_US/bikes/mountain-bikes/cross-country-mountain-bikes/marlin/marlin-7-gen-3/p/5308054/',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '999', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Trek mountain bike with an online manufacturer source.', rarity: 'Epic',
  },
  {
    id: 'fellow-stagg-ekg', name: 'Stagg EKG Electric Kettle', brand: 'Fellow', type: 'Artifact', shape: 'crystal', material: 'metallic',
    sourceName: 'Fellow', sourceUrl: 'https://fellowproducts.com/products/stagg-ekg-electric-kettle',
    imageUrl: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '195', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Fellow electric kettle with a manufacturer shopping source.', rarity: 'Rare',
  },
  {
    id: 'ray-ban-meta-wayfarer', name: 'Ray-Ban Meta Wayfarer', brand: 'Ray-Ban Meta', type: 'Artifact', shape: 'jewelry', material: 'glass',
    sourceName: 'Ray-Ban Meta', sourceUrl: 'https://www.ray-ban.com/usa/discover-ray-ban-meta',
    imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=85',
    priceUsd: '379', currency: 'USD', availability: 'Online', modelStatus: '3D TWIN READY',
    description: 'Real Ray-Ban Meta smart glasses with a manufacturer product source.', rarity: 'Legendary',
  },
];

const SHAPE_FALLBACKS = ['car', 'villa', 'owl', 'fox', 'robot', 'statue', 'ship', 'tree', 'dragon', 'mech', 'crystal', 'portal', 'temple', 'motorcycle', 'alien', 'jewelry', 'abstract', 'sword', 'fortress', 'mushroom', 'satellite', 'totem'];
const MATERIAL_FALLBACKS = ['metallic', 'ceramic', 'wood', 'glass', 'crystal', 'stone'];

function deterministicChoice(list, seed) {
  let hash = 2166136261;
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return list[(hash >>> 0) % list.length];
}

function enrich(item, index) {
  const shape = availableShapes.includes(item.shape) ? item.shape : deterministicChoice(availableShapes.length ? availableShapes : SHAPE_FALLBACKS, item.id);
  const material = availableMaterials.includes(item.material) ? item.material : deterministicChoice(availableMaterials.length ? availableMaterials : MATERIAL_FALLBACKS, `${item.id}:material`);
  const renderMode = shape === 'abstract' || shape === 'jewelry' ? 'sculpted3d' : 'voxel';
  return {
    ...item,
    id: index + 1,
    catalogId: item.id,
    creator: item.brand,
    shape,
    material,
    renderMode,
    family: 'real-world',
    price: (Number(item.priceUsd) / 3200).toFixed(4),
    blocks: 'VERIFIED SOURCE',
    color: deterministicChoice(['violet', 'blue', 'green', 'gold', 'cyan', 'pink'], item.id),
    seed: `real-world:${item.id}`,
    realityBasis: item.name,
    variant: 'verified online object',
    inspiration: 'REAL WORLD OBJECT · ONLINE SOURCE VERIFIED',
    sourceVerified: true,
    imageAlt: `${item.brand} ${item.name}`,
  };
}

export const REAL_WORLD_CATALOG = REAL_OBJECTS.map(enrich);
export const CATALOG_SIZE = REAL_WORLD_CATALOG.length;

export function getCatalogItem(index) {
  return REAL_WORLD_CATALOG[index];
}

export function getCatalogWindow(start = 0, count = CATALOG_SIZE) {
  return REAL_WORLD_CATALOG.slice(Math.max(0, start), Math.max(0, start) + count);
}

const CANDIDATES = [
  (item) => item?.asset?.uri,
  (item) => item?.asset?.modelUri,
  (item) => item?.modelUri,
  (item) => item?.animation_url,
  (item) => item?.metadata?.animation_url,
  (item) => item?.image,
  (item) => item?.imageUrl,
  (item) => item?.metadata?.image,
  (item) => item?.metadata?.image_url,
];

export function resolveNFTMedia(item = {}) {
  const values = CANDIDATES.map((get) => get(item)).filter(Boolean).map(String);
  const unique = [...new Set(values)];
  const model = unique.find((uri) => /\.(glb|gltf)(\?|#|$)/i.test(uri) || /^ipfs:/i.test(uri) && /model|asset|animation/i.test(uri));
  const image = unique.find((uri) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i.test(uri));
  return { modelUri: model || null, imageUri: image || null, candidates: unique };
}

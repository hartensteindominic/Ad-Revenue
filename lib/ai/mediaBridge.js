export function getAIAssetMedia(asset = {}) {
  const modelUri = typeof asset.modelUri === 'string' && asset.modelUri.trim() ? asset.modelUri.trim() : null;
  const previewUri = typeof asset.previewUri === 'string' && asset.previewUri.trim() ? asset.previewUri.trim() : null;
  return { modelUri, previewUri, has3D: Boolean(modelUri), hasPreview: Boolean(previewUri), ready: Boolean(modelUri || previewUri) };
}

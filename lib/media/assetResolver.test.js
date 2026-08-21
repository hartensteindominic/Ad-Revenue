import { resolveNFTMedia } from './assetResolver';

describe('resolveNFTMedia', () => {
  test('prefers a model URI for 3D assets', () => {
    expect(resolveNFTMedia({ modelUri: 'ipfs://model.glb', previewUri: 'ipfs://preview.webp' })).toEqual({
      modelUri: 'ipfs://model.glb', previewUri: 'ipfs://preview.webp', kind: '3d', ready: true,
    });
  });

  test('uses image media when no model exists', () => {
    expect(resolveNFTMedia({ image: 'ipfs://preview.webp' })).toEqual({
      modelUri: null, previewUri: 'ipfs://preview.webp', kind: '2d', ready: true,
    });
  });

  test('falls back to procedural mode when media is absent', () => {
    expect(resolveNFTMedia({ name: 'Test' })).toEqual({
      modelUri: null, previewUri: null, kind: 'procedural', ready: false,
    });
  });
});

import assert from 'node:assert/strict';
import { resolveNFTMedia } from '../lib/media/assetResolver.js';

assert.deepEqual(resolveNFTMedia({ modelUri: 'https://example.com/a.glb' }), { modelUri: 'https://example.com/a.glb', previewUri: null, kind: '3d', ready: true });
assert.deepEqual(resolveNFTMedia({ imageUrl: 'https://example.com/a.webp' }), { modelUri: null, previewUri: 'https://example.com/a.webp', kind: '2d', ready: true });
assert.deepEqual(resolveNFTMedia({ gltf: ' https://example.com/a.gltf ' }), { modelUri: 'https://example.com/a.gltf', previewUri: null, kind: '3d', ready: true });
assert.deepEqual(resolveNFTMedia({}), { modelUri: null, previewUri: null, kind: 'procedural', ready: false });
console.log('media resolver tests passed');

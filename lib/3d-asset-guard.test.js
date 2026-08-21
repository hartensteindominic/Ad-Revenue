import { isSupported3DUrl } from './3d-asset-guard';

test('accepts GLB and GLTF URLs', () => {
  expect(isSupported3DUrl('https://cdn.example.com/model.glb')).toBe(true);
  expect(isSupported3DUrl('https://cdn.example.com/model.gltf?x=1')).toBe(true);
});

test('rejects unsupported or malformed URLs', () => {
  expect(isSupported3DUrl('javascript:alert(1)')).toBe(false);
  expect(isSupported3DUrl('https://example.com/image.png')).toBe(false);
  expect(isSupported3DUrl('not-a-url')).toBe(false);
});

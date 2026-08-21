import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const voxel = await readFile(new URL('../app/components/VoxelViewer.js', import.meta.url), 'utf8');
const art = await readFile(new URL('../app/components/ArtPreview.js', import.meta.url), 'utf8');

// Passive mobile rendering must not be silently disabled by a workflow mutation.
// The guard only verifies that the source retains an explicit mobile strategy.
assert.match(voxel, /ResizeObserver/, 'VoxelViewer must observe its rendered frame');
assert.match(art, /ResizeObserver/, 'ArtPreview must observe its rendered frame');

console.log('Mobile WebGL source guard passed.');

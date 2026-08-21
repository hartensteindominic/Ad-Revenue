import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const vault = await readFile(new URL('../app/components/VaultUniverse.js', import.meta.url), 'utf8');
const voxel = await readFile(new URL('../app/components/VoxelViewer.js', import.meta.url), 'utf8');
const art = await readFile(new URL('../app/components/ArtPreview.js', import.meta.url), 'utf8');

assert.match(vault, /function MediaFrame\(/, 'gallery must use the unified media frame');
assert.doesNotMatch(vault, /index\s*<\s*2\s*\?/, 'gallery must not limit live rendering to the first two cards');
assert.match(vault, /\.mediaCanvas\{[^}]*display:grid;place-items:center/, 'media frame must center its contents');
assert.match(vault, /\.mediaCanvas canvas\{[^}]*width:100%[^}]*height:100%/, 'canvas must fill its frame');
assert.match(vault, /\.artVisual>\.mediaCanvas\{[^}]*z-index:1/, 'media must occupy the complete card visual layer');
assert.match(vault, /className="mediaFallback"/, 'gallery must have a non-blank failure state');
assert.match(vault, /3D PREVIEW RECOVERING/, 'failure state must be visible to the collector');
assert.match(vault, /onFailure:/, 'viewer failure callback must be wired');
assert.match(voxel, /Box3/, 'voxel viewer must calculate model bounds');
assert.match(voxel, /controls\.target\.copy\(center\)/, 'voxel viewer must center camera target on bounds');
assert.match(voxel, /ResizeObserver/, 'voxel viewer must respond to its actual rendered size');
assert.match(art, /Box3/, 'procedural art preview must have bounds-aware framing');

console.log('Voxel Vault gallery media regression checks passed.');

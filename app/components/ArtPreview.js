'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MATERIALS = {
  chrome: { color: 0xbfc8d8, metalness: 0.94, roughness: 0.11 },
  metallic: { color: 0x8f9bad, metalness: 0.86, roughness: 0.2 },
  gold: { color: 0xd6a52d, metalness: 0.96, roughness: 0.16 },
  glass: { color: 0x8ddcff, metalness: 0.05, roughness: 0.06, transparent: true, opacity: 0.58 },
  crystal: { color: 0xb894ff, metalness: 0.28, roughness: 0.08, transparent: true, opacity: 0.82 },
  stone: { color: 0x9c9387, metalness: 0.05, roughness: 0.88 },
  ceramic: { color: 0xe5dfd2, metalness: 0.08, roughness: 0.28 },
  organic: { color: 0x5f9b63, metalness: 0.02, roughness: 0.76 },
  holographic: { color: 0x9f83ff, metalness: 0.72, roughness: 0.14, emissive: 0x39257a, emissiveIntensity: 0.22 },
  neon: { color: 0x38dfff, metalness: 0.42, roughness: 0.18, emissive: 0x18bfff, emissiveIntensity: 0.6 },
  obsidian: { color: 0x171922, metalness: 0.7, roughness: 0.16 },
  ice: { color: 0xb8e9ff, metalness: 0.12, roughness: 0.12, transparent: true, opacity: 0.72 },
};

const GLOW_LEVELS = {
  none: { intensity: 0, radius: 0 },
  subtle: { intensity: 0.14, radius: 0.055 },
  rare: { intensity: 0.28, radius: 0.075 },
  epic: { intensity: 0.46, radius: 0.095 },
  legendary: { intensity: 0.68, radius: 0.12 },
};

function glowLevelFor(seed, explicit) {
  if (explicit && GLOW_LEVELS[explicit]) return explicit;
  const n = Number.parseInt(String(seed || '').slice(-2), 16);
  if (!Number.isFinite(n)) return 'subtle';
  if (n >= 240) return 'legendary';
  if (n >= 180) return 'epic';
  if (n >= 105) return 'rare';
  return 'subtle';
}

function hash(input) { let h = 2166136261; for (let i = 0; i < String(input).length; i += 1) { h ^= String(input).charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = hash(seed) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
function materialFor(name, accent = 0) { const base = MATERIALS[name] || MATERIALS.metallic; const mat = new THREE.MeshPhysicalMaterial({ ...base }); if (name === 'glass' || name === 'crystal' || name === 'ice') { mat.transmission = 0.22; mat.thickness = 0.45; mat.ior = 1.45; } if (accent) mat.color.offsetHSL(accent, 0, 0); return mat; }
function addMesh(group, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh; }
function addGlow(group, position, color, size = 0.12, intensity = 0.9) { const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.min(0.9, intensity) })); mesh.position.set(...position); group.add(mesh); }

function createVehicle(group, m, random) { const body = addMesh(group, new THREE.SphereGeometry(1, 20, 12), m, [0, 0.25, 0], [0, 0, 0], [2.7, 0.62, 1.35]); body.scale.y = 0.7; addMesh(group, new THREE.SphereGeometry(1, 18, 10), m, [0.15, 0.82, 0], [0, 0, 0], [1.35, 0.58, 1.05]); addMesh(group, new THREE.BoxGeometry(1.5, 0.38, 1.55), materialFor('glass'), [0.1, 0.98, 0], [0, 0, 0], [1, 1, 0.72]); const wheelMat = materialFor('obsidian'); for (const x of [-1.65, 1.65]) for (const z of [-1.05, 1.05]) addMesh(group, new THREE.CylinderGeometry(0.42, 0.42, 0.22, 20), wheelMat, [x, -0.3, z], [Math.PI / 2, 0, 0]); addGlow(group, [-2.72, 0.22, -0.48], 0x9cecff, 0.13); addGlow(group, [-2.72, 0.22, 0.48], 0x9cecff, 0.13); if (random() > 0.45) addMesh(group, new THREE.BoxGeometry(0.08, 0.08, 2.2), materialFor('neon'), [2.45, 0.4, 0]); }
function createCreature(group, m, random) { addMesh(group, new THREE.SphereGeometry(1, 18, 14), m, [0, 0.5, 0], [0, 0, 0], [1.25, 1.05, 1.45]); addMesh(group, new THREE.SphereGeometry(1, 16, 12), m, [0, 1.75, 0.25], [0, 0, 0], [0.82, 0.82, 0.9]); for (const x of [-0.55, 0.55]) addMesh(group, new THREE.ConeGeometry(0.3, 1.05, 12), m, [x, 2.5, 0.2], [0, 0, x < 0 ? -0.25 : 0.25]); for (const x of [-0.78, 0.78]) for (const z of [-0.72, 0.72]) addMesh(group, new THREE.CapsuleGeometry(0.18, 0.75, 6, 10), m, [x, -0.05, z], [0, 0, x * -0.18]); addGlow(group, [-0.3, 1.85, -0.72], 0xff6bcb, 0.08); addGlow(group, [0.3, 1.85, -0.72], 0xff6bcb, 0.08); if (random() > 0.35) addMesh(group, new THREE.TorusGeometry(1.15, 0.055, 8, 40), materialFor('holographic'), [0, 0.85, 0], [Math.PI / 2, 0, 0]); }
function createRobot(group, m, random) { addMesh(group, new THREE.BoxGeometry(1.8, 2.2, 1.4), m, [0, 0.7, 0]); addMesh(group, new THREE.SphereGeometry(0.78, 16, 12), m, [0, 2.25, 0], [0, 0, 0], [1, 0.9, 0.9]); for (const x of [-1.45, 1.45]) { addMesh(group, new THREE.CapsuleGeometry(0.22, 1.2, 6, 10), m, [x, 0.8, 0], [0, 0, x < 0 ? 0.2 : -0.2]); addMesh(group, new THREE.BoxGeometry(0.6, 1.65, 0.7), m, [x * 0.48, -1.0, 0]); } addGlow(group, [-0.28, 2.28, -0.72], 0x48eaff, 0.09); addGlow(group, [0.28, 2.28, -0.72], 0x48eaff, 0.09); if (random() > 0.3) addMesh(group, new THREE.TorusGeometry(1.3, 0.06, 8, 32), materialFor('neon'), [0, 0.6, 0], [Math.PI / 2, 0, 0]); }
function createArchitecture(group, m, random) { addMesh(group, new THREE.BoxGeometry(4.6, 0.45, 4.2), m, [0, -1.45, 0]); for (const x of [-1.7, 1.7]) for (const z of [-1.45, 1.45]) addMesh(group, new THREE.CylinderGeometry(0.22, 0.32, 3.8, 16), m, [x, 0.35, z]); addMesh(group, new THREE.BoxGeometry(3.8, 0.42, 3.3), m, [0, 2.25, 0]); addMesh(group, new THREE.ConeGeometry(2.6, 2.0, 6), m, [0, 3.45, 0], [0, Math.PI / 6, 0]); for (const x of [-1.05, 1.05]) for (const z of [-1.5, 1.5]) addMesh(group, new THREE.BoxGeometry(0.65, 1.35, 0.05), materialFor('glass'), [x, 0.4, z]); if (random() > 0.4) addMesh(group, new THREE.TorusGeometry(2.2, 0.045, 8, 48), materialFor('holographic'), [0, 1.1, 0], [Math.PI / 2, 0, 0]); }
function createArtifact(group, m, random) { addMesh(group, new THREE.CylinderGeometry(0.8, 1.05, 0.42, 32), m, [0, -1.35, 0]); addMesh(group, new THREE.TorusKnotGeometry(0.8, 0.18, 96, 16, 2, 3), m, [0, 0.2, 0], [0.3, 0.1, 0]); addMesh(group, new THREE.OctahedronGeometry(0.48, 1), materialFor('crystal'), [0, 1.65, 0]); if (random() > 0.3) addMesh(group, new THREE.TorusGeometry(1.65, 0.045, 8, 64), materialFor('gold'), [0, 0.2, 0], [Math.PI / 2, 0, 0]); }
function createNature(group, m, random) { addMesh(group, new THREE.CylinderGeometry(0.35, 0.6, 2.4, 12), materialFor('organic'), [0, -0.1, 0]); for (let i = 0; i < 10; i += 1) { const a = (i / 10) * Math.PI * 2; const radius = 0.7 + random() * 0.55; addMesh(group, new THREE.IcosahedronGeometry(0.7 + random() * 0.35, 1), m, [Math.cos(a) * radius, 1.2 + random() * 1.2, Math.sin(a) * radius], [random(), random(), random()]); } addGlow(group, [0, 1.8, 0], 0x6cffaa, 0.1); }
function createAbstract(group, m, random) { const count = 5 + Math.floor(random() * 4); for (let i = 0; i < count; i += 1) { const a = (i / count) * Math.PI * 2; const radius = 0.7 + random() * 0.8; const geometry = i % 2 ? new THREE.TorusKnotGeometry(0.45, 0.11, 72, 10, 2 + (i % 3), 3) : new THREE.IcosahedronGeometry(0.6 + random() * 0.4, 2); addMesh(group, geometry, m, [Math.cos(a) * radius, Math.sin(a * 1.7) * 0.8, Math.sin(a) * radius], [random() * 2, random() * 2, random() * 2]); } addMesh(group, new THREE.TorusGeometry(2.4, 0.05, 8, 64), materialFor('neon'), [0, 0, 0], [Math.PI / 2, 0, 0]); }
function createSculpture(group, m, random) { addMesh(group, new THREE.SphereGeometry(1, 24, 16), m, [0, 0.1, 0], [0, 0, 0], [1.25, 1.7, 0.9]); addMesh(group, new THREE.TorusKnotGeometry(0.65, 0.16, 100, 14, 2, 5), m, [0, 1.1, 0], [0.5, 0.2, 0.1]); addMesh(group, new THREE.TorusGeometry(1.8, 0.045, 8, 64), materialFor('holographic'), [0, 0.2, 0], [0.35, 0.7, 0]); if (random() > 0.5) addMesh(group, new THREE.OctahedronGeometry(0.7, 1), materialFor('crystal'), [0, 2.3, 0]); }
function createArtwork(family, materialName, seed) { const group = new THREE.Group(); const random = rng(`${seed}:${family}:${materialName}`); const m = materialFor(materialName, (random() - 0.5) * 0.08); if (family === 'vehicle') createVehicle(group, m, random); else if (family === 'creature') createCreature(group, m, random); else if (family === 'robot') createRobot(group, m, random); else if (family === 'architecture') createArchitecture(group, m, random); else if (family === 'artifact') createArtifact(group, m, random); else if (family === 'nature') createNature(group, m, random); else if (family === 'abstract') createAbstract(group, m, random); else createSculpture(group, m, random); return group; }
function Fallback({ compact, message = '3D preview unavailable' }) { return <div role="img" aria-label={message} style={{ width: '100%', height: '100%', minHeight: compact ? 140 : 260, display: 'grid', placeItems: 'center', borderRadius: 18, background: 'radial-gradient(circle at 50% 35%, rgba(125,96,255,.22), rgba(5,6,12,.96) 62%)', color: '#dfe3f5', padding: 24, textAlign: 'center' }}><div><div style={{ fontSize: 11, letterSpacing: '.18em', fontWeight: 900, color: '#a78bff' }}>VOXEL VAULT</div><div style={{ marginTop: 8, fontWeight: 800 }}>{message}</div><div style={{ marginTop: 6, color: '#858da5', fontSize: 12 }}>3D is unavailable on this device right now.</div></div></div>; }

function WebGLPreview({ family, material, seed, compact, interactive, showcase, glowLevel, onFailure }) {
  const host = useRef(null); const failedRef = useRef(false);
  useEffect(() => {
    if (!host.current || typeof window === 'undefined') return undefined;
    const root = host.current; let renderer; let controls; let scene; let raf = 0; let disposed = false;
    const fail = () => { if (failedRef.current || disposed) return; failedRef.current = true; cancelAnimationFrame(raf); onFailure?.(); };
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) || probe.getContext('webgl', { failIfMajorPerformanceCaveat: false });
      if (!gl) { fail(); return undefined; }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      scene = new THREE.Scene(); scene.background = new THREE.Color(0x05060c);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0.8, showcase ? 10 : 8);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: compact ? 'low-power' : 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)); renderer.setSize(Math.max(root.clientWidth, 1), Math.max(root.clientHeight, compact ? 180 : 300), false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = !compact; root.replaceChildren(renderer.domElement); renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
      scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x111522, 1.5)); const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 6); key.castShadow = !compact; scene.add(key); const rim = new THREE.DirectionalLight(0x8ca8ff, 1.0); rim.position.set(-5, 3, -5); scene.add(rim);
      const group = createArtwork(family, material, seed); scene.add(group);
      const glow = GLOW_LEVELS[glowLevel] || GLOW_LEVELS.subtle;
      if (glow.intensity > 0) {
        const aura = new THREE.PointLight(0xb6c9ff, glow.intensity * 1.8, 5 + glow.intensity * 4, 2);
        aura.position.set(0, 1.2, 0.8); group.add(aura);
        if (glow.radius > 0.06) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.018 + glow.intensity * 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: 0xaec7ff, transparent: true, opacity: glow.intensity * 0.32 }));
          ring.rotation.x = Math.PI / 2; group.add(ring);
        }
      }
      const box = new THREE.Box3().setFromObject(group); const center = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3()); group.position.sub(center); const maxDim = Math.max(size.x, size.y, size.z, 1); camera.position.z = Math.max(showcase ? 7.5 : 6.5, maxDim * 2.35); camera.lookAt(0, 0, 0);
      if (interactive !== false) { controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = Math.max(3, maxDim * 1.2); controls.maxDistance = Math.max(12, maxDim * 5); controls.target.set(0, 0, 0); }
      const resize = () => { if (!renderer || disposed) return; const w = Math.max(root.clientWidth, 1); const h = Math.max(root.clientHeight, compact ? 180 : 300); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
      const observer = new ResizeObserver(resize); observer.observe(root); resize();
      const tick = () => { if (disposed) return; controls?.update(); if (!interactive) group.rotation.y += 0.0025; renderer.render(scene, camera); raf = requestAnimationFrame(tick); }; tick();
      return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); controls?.dispose(); scene?.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach((m) => m.dispose?.()); } }); renderer?.dispose(); renderer?.forceContextLoss?.(); };
    } catch (error) { console.error('Voxel Vault 3D preview failed', error); fail(); return undefined; }
  }, [family, material, seed, compact, interactive, showcase, glowLevel, onFailure]);
  return <div ref={host} style={{ width: '100%', height: '100%', minHeight: compact ? 180 : 320, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 18, background: 'radial-gradient(circle at 50% 38%, rgba(125,96,255,.10), rgba(5,6,12,.98) 68%)' }} />;
}

export default function ArtPreview({ family = 'sculpture', material = 'metallic', seed = 'voxel', compact = false, interactive = true, showcase = false, glowLevel, className = '', onFailure }) {
  const [failed, setFailed] = useState(false);
  const resolvedGlow = glowLevelFor(seed, glowLevel);
  if (failed) return <div className={className}><Fallback compact={compact} /><button type="button" onClick={() => setFailed(false)} style={{ marginTop: 8 }}>Retry 3D</button></div>;
  return <div className={className} data-glow-level={resolvedGlow} aria-label={`${resolvedGlow} glow collectible`}><WebGLPreview family={family} material={material} seed={seed} compact={compact} interactive={interactive} showcase={showcase} glowLevel={resolvedGlow} onFailure={() => { setFailed(true); onFailure?.(); }} /></div>;
}

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CACHE_PREFIX = 'vv3-image-to-3d:';

async function generateFromImage(imageUrl, item, cacheKey) {
  const cacheName = CACHE_PREFIX + cacheKey;
  const cached = window.localStorage.getItem(cacheName);
  if (cached) {
    try {
      const response = await fetch(cached, { method: 'HEAD', cache: 'no-store' });
      if (response.ok) return cached;
    } catch {}
    window.localStorage.removeItem(cacheName);
  }
  const start = await fetch('/api/image-to-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, item: { name: item?.name, type: item?.type, material: item?.material, sourceName: item?.sourceName, sourceNote: item?.sourceNote } }),
  });
  if (!start.ok) throw new Error('Image-to-3D generation is not configured or failed to start.');
  const { taskId } = await start.json();
  if (!taskId) throw new Error('Image-to-3D provider returned no task id.');
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    const status = await fetch(`/api/image-to-3d?taskId=${encodeURIComponent(taskId)}`, { cache: 'no-store' });
    if (!status.ok) throw new Error('Unable to read image-to-3D generation status.');
    const data = await status.json();
    if (data.status === 'SUCCEEDED' && data.modelUrl) {
      window.localStorage.setItem(cacheName, data.modelUrl);
      return data.modelUrl;
    }
    if (['FAILED', 'CANCELED'].includes(data.status)) throw new Error(data.error || 'Image-to-3D generation failed.');
  }
  throw new Error('Image-to-3D generation timed out.');
}

function makeMaterial(texture, color, metalness, roughness) {
  if (texture) texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhysicalMaterial({ color, map: texture || null, metalness, roughness, clearcoat: 0.35, clearcoatRoughness: 0.18 });
}
function box(group, size, position, material) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); group.add(mesh); return mesh; }
function createProductTwin(item, imageUrl) {
  const group = new THREE.Group();
  const texture = imageUrl ? new THREE.TextureLoader().load(imageUrl) : null;
  const name = `${item?.name || ''} ${item?.type || ''}`.toLowerCase();
  const product = makeMaterial(texture, 0xf1f3f7, 0.18, 0.3), dark = makeMaterial(null, 0x171a24, 0.72, 0.2), metal = makeMaterial(null, 0x8d93a5, 0.78, 0.22), soft = makeMaterial(null, 0xc8ccd6, 0.12, 0.62);
  if (name.includes('blender')) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 2.15, 48), product); body.position.y = 0.25; group.add(body);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.28, 48), dark); base.position.y = -0.92; group.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.2, 48), dark); cap.position.y = 1.42; group.add(cap);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.11, 18, 48, Math.PI), dark); handle.rotation.z = Math.PI / 2; handle.position.set(0.7, 0.25, 0); group.add(handle);
  } else if (name.includes('lamp')) {
    box(group, [1.65, 0.24, 1.05], [0, -1.15, 0], dark);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.85, 24), metal); stem.position.set(0, -0.15, 0); stem.rotation.z = -0.12; group.add(stem);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.42, 0.52, 48), product); shade.position.set(0.12, 0.82, 0); shade.rotation.z = -0.18; group.add(shade);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshBasicMaterial({ color: 0xfff1c4 })); glow.position.set(0.2, 0.55, 0.27); group.add(glow);
  } else if (name.includes('bowl') || name.includes('fountain') || name.includes('dispenser')) {
    const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 1.0, 48), product); reservoir.position.y = -0.2; group.add(reservoir);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.82, 0.28, 48), soft); basin.position.y = -0.82; group.add(basin);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.08, 18, 64), dark); rim.rotation.x = Math.PI / 2; rim.position.y = -0.64; group.add(rim);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.72, 24), metal); spout.position.y = 0.55; group.add(spout);
  } else if (name.includes('vanity') || name.includes('desk')) {
    box(group, [2.7, 0.22, 1.15], [0, 0.35, 0], product); box(group, [0.22, 1.55, 0.9], [-1.15, -0.45, 0], dark); box(group, [0.22, 1.55, 0.9], [1.15, -0.45, 0], dark); box(group, [1.45, 1.25, 0.1], [0, 1.15, -0.02], metal);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.08), new THREE.MeshPhysicalMaterial({ color: 0x8fa3c8, metalness: 0.65, roughness: 0.12 })); mirror.position.set(0, 1.15, 0.045); group.add(mirror); box(group, [0.85, 0.28, 0.85], [0, -1.25, 0], soft);
  } else if (name.includes('cup') || name.includes('bottle') || name.includes('water')) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.54, 1.9, 48), product); body.position.y = 0; group.add(body); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.45, 40), dark); neck.position.y = 1.12; group.add(neck); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 40), dark); cap.position.y = 1.43; group.add(cap);
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 32), product); body.scale.set(1.1, 1.05, 0.72); group.add(body); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.25, 48), dark); base.position.y = -0.95; group.add(base);
  }
  return group;
}

export default function RealProductModel({ item, onLoaded }) {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    const directUrl = item?.modelUri || item?.digitalTwin?.modelUrl;
    const imageUrl = item?.previewUri || item?.digitalTwin?.previewUrl;
    if (!root || (!directUrl && !imageUrl)) return undefined;
    let alive = true;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100), renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none'; root.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x11131c, 2.8)); const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(4, 6, 5); scene.add(key); const rim = new THREE.DirectionalLight(0x7566ff, 2.5); rim.position.set(-4, 3, -4); scene.add(rim);
    let model = null, raf;
    const normalize = object => { const box3 = new THREE.Box3().setFromObject(object), size = box3.getSize(new THREE.Vector3()), center = box3.getCenter(new THREE.Vector3()); object.position.sub(center); object.scale.setScalar(2.65 / (Math.max(size.x, size.y, size.z) || 1)); object.position.y += 0.05; };
    const showModel = object => { if (!alive) return false; normalize(object); scene.add(object); model = object; camera.position.set(0, 0.15, 5.2); camera.lookAt(0, 0, 0); onLoaded?.(true); return true; };
    const loadGlb = url => new Promise((resolve, reject) => new GLTFLoader().load(url, gltf => resolve(gltf.scene), undefined, reject));
    const createProceduralTwin = () => { if (alive) showModel(createProductTwin(item, imageUrl)); };
    (async () => {
      if (directUrl) { try { showModel(await loadGlb(directUrl)); return; } catch { createProceduralTwin(); return; } }
      if (!imageUrl) return;
      try {
        const generatedUrl = await generateFromImage(imageUrl, item, item?.id || item?.slug || imageUrl);
        if (!alive || !generatedUrl) throw new Error('No generated model URL.');
        const generatedModel = await loadGlb(generatedUrl); if (!alive) return; showModel(generatedModel);
      } catch { createProceduralTwin(); }
    })();
    const resize = () => { if (!alive) return; const width = Math.max(root.clientWidth, 1), height = Math.max(root.clientHeight, 1); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(root); const tick = () => { if (!alive) return; raf = requestAnimationFrame(tick); if (model) model.rotation.y += 0.0024; renderer.render(scene, camera); }; tick();
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement); scene.traverse(object => { object.geometry?.dispose?.(); if (Array.isArray(object.material)) object.material.forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); else { object.material?.map?.dispose?.(); object.material?.dispose?.(); } }); renderer.dispose(); };
  }, [item, onLoaded]);
  if (!item?.modelUri && !item?.digitalTwin?.modelUrl && !item?.previewUri && !item?.digitalTwin?.previewUrl) return null;
  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />;
}

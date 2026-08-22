'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CACHE_PREFIX = 'vv3-image-to-3d:';

async function generateFromImage(imageUrl, cacheKey) {
  const cached = window.localStorage.getItem(CACHE_PREFIX + cacheKey);
  if (cached) return cached;
  const start = await fetch('/api/image-to-3d', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  if (!start.ok) throw new Error('Image-to-3D generation is not configured or failed to start.');
  const { taskId } = await start.json();
  if (!taskId) throw new Error('Image-to-3D provider returned no task id.');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise(r => setTimeout(r, 4000));
    const status = await fetch(`/api/image-to-3d?taskId=${encodeURIComponent(taskId)}`, { cache: 'no-store' });
    if (!status.ok) throw new Error('Unable to read image-to-3D generation status.');
    const data = await status.json();
    if (data.status === 'SUCCEEDED' && data.modelUrl) {
      window.localStorage.setItem(CACHE_PREFIX + cacheKey, data.modelUrl);
      return data.modelUrl;
    }
    if (['FAILED', 'CANCELED'].includes(data.status)) throw new Error(`Image-to-3D generation ${data.status.toLowerCase()}.`);
  }
  throw new Error('Image-to-3D generation timed out.');
}

export default function RealProductModel({ item, onLoaded }) {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    const directUrl = item?.modelUri || item?.digitalTwin?.modelUrl;
    const imageUrl = item?.previewUri || item?.digitalTwin?.previewUrl;
    if (!root || (!directUrl && !imageUrl)) return undefined;
    let alive = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    root.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x11131c, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(4, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7566ff, 2.5); rim.position.set(-4, 3, -4); scene.add(rim);
    let model;
    let raf;
    const finish = () => {
      if (!alive || !model) return;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(2.6 / (Math.max(size.x, size.y, size.z) || 1));
      scene.add(model);
      camera.position.set(0, .15, 5.2); camera.lookAt(0, 0, 0);
      onLoaded?.(true);
    };
    const loadGlb = url => new Promise((resolve, reject) => {
      new GLTFLoader().load(url, gltf => { model = gltf.scene; finish(); resolve(); }, undefined, reject);
    });
    const createImageFallback = () => {
      const group = new THREE.Group();
      const map = new THREE.TextureLoader().load(imageUrl, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
      const frame = new THREE.MeshPhysicalMaterial({ color: 0x171a25, metalness: .72, roughness: .2, clearcoat: .55 });
      const face = new THREE.MeshBasicMaterial({ map });
      const back = new THREE.MeshBasicMaterial({ color: 0x080a10 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.7, .22), frame);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.4), face);
      const rear = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.4), back);
      front.position.z = .125; rear.position.z = -.125; rear.rotation.y = Math.PI;
      group.add(body, front, rear); model = group; finish();
    };
    (async () => {
      if (directUrl) {
        try { await loadGlb(directUrl); }
        catch { createImageFallback(); }
      } else if (imageUrl) {
        createImageFallback();
        // Upgrade the fallback to a textured AI-generated GLB when the server has MESHY_API_KEY.
        // The generated URL is cached per product so normal browsing does not regenerate assets.
        try {
          const generatedUrl = await generateFromImage(imageUrl, item?.id || item?.slug || imageUrl);
          if (alive && generatedUrl) {
            if (model) scene.remove(model);
            model = undefined;
            await loadGlb(generatedUrl);
          }
        } catch {
          // Keep the immediate real-product 3D fallback. No broken/blank viewer.
        }
      }
    })();
    const resize = () => { if (!alive) return; const w = Math.max(root.clientWidth, 1), h = Math.max(root.clientHeight, 1); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(root);
    const tick = () => { if (!alive) return; raf = requestAnimationFrame(tick); if (model) model.rotation.y += .0022; renderer.render(scene, camera); }; tick();
    return () => {
      alive = false; cancelAnimationFrame(raf); ro.disconnect();
      if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
      scene.traverse(o => { o.geometry?.dispose?.(); if (Array.isArray(o.material)) o.material.forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); else { o.material?.map?.dispose?.(); o.material?.dispose?.(); } });
      renderer.dispose();
    };
  }, [item, onLoaded]);
  if (!item?.modelUri && !item?.digitalTwin?.modelUrl && !item?.previewUri && !item?.digitalTwin?.previewUrl) return null;
  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />;
}

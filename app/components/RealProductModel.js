'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CACHE_PREFIX = 'vv3-image-to-3d:';

async function generateFromImage(imageUrl, cacheKey) {
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
    body: JSON.stringify({ imageUrl }),
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
    if (['FAILED', 'CANCELED'].includes(data.status)) {
      throw new Error(data.error || `Image-to-3D generation ${data.status.toLowerCase()}.`);
    }
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    root.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x11131c, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7566ff, 2.5);
    rim.position.set(-4, 3, -4);
    scene.add(rim);

    let model = null;
    let raf;

    const normalize = object => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      object.scale.setScalar(2.6 / (Math.max(size.x, size.y, size.z) || 1));
      object.position.y += 0.05;
    };

    const showModel = object => {
      if (!alive) return false;
      normalize(object);
      scene.add(object);
      model = object;
      camera.position.set(0, 0.15, 5.2);
      camera.lookAt(0, 0, 0);
      onLoaded?.(true);
      return true;
    };

    const loadGlb = url => new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        gltf => resolve(gltf.scene),
        undefined,
        reject,
      );
    });

    const createImageFallback = () => {
      if (!imageUrl || !alive) return;
      const group = new THREE.Group();
      const map = new THREE.TextureLoader().load(imageUrl, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
      });
      const frame = new THREE.MeshPhysicalMaterial({ color: 0x171a25, metalness: .72, roughness: .2, clearcoat: .55 });
      const face = new THREE.MeshBasicMaterial({ map });
      const back = new THREE.MeshBasicMaterial({ color: 0x080a10 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.7, .22), frame);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.4), face);
      const rear = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.4), back);
      front.position.z = .125;
      rear.position.z = -.125;
      rear.rotation.y = Math.PI;
      group.add(body, front, rear);
      showModel(group);
    };

    (async () => {
      if (directUrl) {
        try {
          const exactModel = await loadGlb(directUrl);
          showModel(exactModel);
          return;
        } catch {
          createImageFallback();
          return;
        }
      }

      if (!imageUrl) return;

      // Always show the real product immediately. AI reconstruction is an upgrade,
      // never a dependency that can make the viewer disappear.
      createImageFallback();

      try {
        const generatedUrl = await generateFromImage(imageUrl, item?.id || item?.slug || imageUrl);
        if (!alive || !generatedUrl) return;

        const generatedModel = await loadGlb(generatedUrl);
        if (!alive) return;

        if (model) scene.remove(model);
        showModel(generatedModel);
      } catch {
        // The real-product 3D fallback stays visible when the AI provider is unavailable,
        // the signed asset expires, credits are exhausted, or generation fails.
      }
    })();

    const resize = () => {
      if (!alive) return;
      const width = Math.max(root.clientWidth, 1);
      const height = Math.max(root.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const tick = () => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (model) model.rotation.y += 0.0022;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
      scene.traverse(object => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => { material.map?.dispose?.(); material.dispose?.(); });
        } else {
          object.material?.map?.dispose?.();
          object.material?.dispose?.();
        }
      });
      renderer.dispose();
    };
  }, [item, onLoaded]);

  if (!item?.modelUri && !item?.digitalTwin?.modelUrl && !item?.previewUri && !item?.digitalTwin?.previewUrl) return null;
  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />;
}

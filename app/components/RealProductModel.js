'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function RealProductModel({ item, onLoaded }) {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    const url = item?.modelUri || item?.digitalTwin?.modelUrl;
    const imageUrl = item?.previewUri || item?.digitalTwin?.previewUrl;
    if (!root || (!url && !imageUrl)) return undefined;
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
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7566ff, 2.5);
    rim.position.set(-4, 3, -4);
    scene.add(rim);

    let model;
    const finish = () => {
      if (!alive || !model) return;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(2.6 / (Math.max(size.x, size.y, size.z) || 1));
      scene.add(model);
      camera.position.set(0, .15, 5.2);
      camera.lookAt(0, 0, 0);
      onLoaded?.(true);
    };

    if (url) {
      const loader = new GLTFLoader();
      loader.load(url, gltf => { model = gltf.scene; finish(); }, undefined, () => {
        // A real product image remains the visual source of truth if an exact GLB fails.
        if (!imageUrl) onLoaded?.(false);
      });
    } else if (imageUrl) {
      // Product-specific 3D NFT fallback: the actual real-product image is wrapped
      // in a thick, beveled, double-sided collectible and rendered as a real 3D object.
      const group = new THREE.Group();
      const tex = new THREE.TextureLoader();
      tex.setCrossOrigin('anonymous');
      const map = tex.load(imageUrl, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
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
      group.position.set(0, 0, 0);
      model = group;
      finish();
    }

    const resize = () => {
      if (!alive) return;
      const w = Math.max(root.clientWidth, 1);
      const h = Math.max(root.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    let raf;
    const tick = () => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (model) model.rotation.y += .0025;
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.replaceChildren();
      scene.traverse(o => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach(m => { m.map?.dispose?.(); m.dispose?.(); });
        else { o.material?.map?.dispose?.(); o.material?.dispose?.(); }
      });
      renderer.dispose();
    };
  }, [item, onLoaded]);
  if (!item?.modelUri && !item?.digitalTwin?.modelUrl && !item?.previewUri && !item?.digitalTwin?.previewUrl) return null;
  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }} />;
}

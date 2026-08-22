'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function RealProductModel({ item, onLoaded }) {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    const url = item?.modelUri || item?.digitalTwin?.modelUrl;
    if (!root || !url) return undefined;
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
    const loader = new GLTFLoader();
    loader.load(url, gltf => {
      if (!alive) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(2.6 / (Math.max(size.x, size.y, size.z) || 1));
      scene.add(model);
      camera.position.set(0, .2, 5.2);
      camera.lookAt(0, 0, 0);
      onLoaded?.(true);
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
        model.rotation.y += .0025;
        renderer.render(scene, camera);
      };
      tick();
      root._cleanupModel = () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, undefined, () => onLoaded?.(false));
    return () => {
      alive = false;
      root._cleanupModel?.();
      root.replaceChildren();
      scene.traverse(o => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
        else o.material?.dispose?.();
      });
      renderer.dispose();
    };
  }, [item, onLoaded]);
  if (!item?.modelUri && !item?.digitalTwin?.modelUrl) return null;
  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }} />;
}

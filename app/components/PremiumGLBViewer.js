'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function PremiumGLBViewer({ assetUrl, compact = false }) {
  const host = useRef(null);

  useEffect(() => {
    if (!host.current || !assetUrl) return;
    const root = host.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070811');
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    camera.position.set(3.8, 2.8, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 18;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight('#eee8ff', '#080c14', 2.4));
    const key = new THREE.DirectionalLight('#fff4df', 4.2);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight('#7657ff', 28, 30);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const fill = new THREE.PointLight('#32d8ff', 16, 24);
    fill.position.set(4, 2, -4);
    scene.add(fill);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 64), new THREE.MeshStandardMaterial({ color: '#090c14', roughness: .78, metalness: .12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.15;
    floor.receiveShadow = true;
    scene.add(floor);

    const loader = new GLTFLoader();
    let model = null;
    let frame = 0;
    let cancelled = false;
    loader.load(assetUrl, (gltf) => {
      if (cancelled) return;
      model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) node.material.needsUpdate = true;
        }
      });
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const max = Math.max(size.x, size.y, size.z) || 1;
      model.position.sub(center);
      model.scale.setScalar(2.25 / max);
      model.position.y += 1.05;
      scene.add(model);
    });

    const resize = () => {
      const r = root.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
      camera.aspect = Math.max(.1, r.width / Math.max(1, r.height));
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      ro.disconnect();
      cancelAnimationFrame(frame);
      controls.dispose();
      renderer.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      if (model) {
        model.traverse((node) => {
          if (node.isMesh) {
            node.geometry?.dispose();
            if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
            else node.material?.dispose();
          }
        });
      }
      if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
    };
  }, [assetUrl]);

  return <div ref={host} className={`voxelViewer premiumGLBViewer ${compact ? 'compact' : ''}`} style={{ width: '100%', height: '100%', minHeight: compact ? 240 : 420, position: 'relative', overflow: 'hidden', borderRadius: 18 }} />;
}

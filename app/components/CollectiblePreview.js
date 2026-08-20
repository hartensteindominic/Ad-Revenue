'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CollectiblePreview({ family = 'technology', rarity = 'rare', seed = 'preview' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 220;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b13);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const seedHash = Array.from(String(seed)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const shape = seedHash % 3;
    const geometry = shape === 0
      ? new THREE.IcosahedronGeometry(1.05, 1)
      : shape === 1
        ? new THREE.TorusKnotGeometry(0.72, 0.22, 96, 16)
        : new THREE.DodecahedronGeometry(1.05, 1);

    const material = new THREE.MeshStandardMaterial({
      color: rarity === 'legendary' ? 0xffd36a : rarity === 'epic' ? 0xb68cff : 0x55e6ff,
      metalness: 0.72,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    scene.add(group);

    const ambient = new THREE.AmbientLight(0x8fa6ff, 1.5);
    scene.add(ambient);
    const key = new THREE.PointLight(0x55e6ff, 18, 12);
    key.position.set(2.5, 2.5, 3.5);
    scene.add(key);
    const rim = new THREE.PointLight(0xa183ff, 14, 10);
    rim.position.set(-3, 0.5, -2);
    scene.add(rim);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      group.rotation.x = Math.sin(Date.now() * 0.0007) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [family, rarity, seed]);

  return <div className="preview" ref={mountRef} aria-label={`Interactive 3D ${family} collectible preview`} />;
}

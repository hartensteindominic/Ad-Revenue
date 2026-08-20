'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const FAMILY_SHAPES = {
  vehicles: 0,
  technology: 1,
  fashion: 2,
  sports: 0,
  architecture: 2,
  nature: 0,
  creatures: 1,
  artifacts: 2,
  science: 1,
  scifi: 0,
  fantasy: 1,
  furniture: 2,
  other: 0,
};

export default function CollectiblePreview({ family = 'technology', rarity = 'rare', seed = 'preview' }) {
  const mountRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof window === 'undefined') return undefined;

    let renderer;
    let scene;
    let geometry;
    let material;
    let frame;
    let resizeObserver;
    let dragging = false;
    let lastX = 0;
    let disposed = false;

    const showFallback = () => {
      if (!disposed) setFallback(true);
    };

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080b13);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.35, 4.4);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.touchAction = 'none';
      mount.appendChild(renderer.domElement);

      const group = new THREE.Group();
      const seedHash = Array.from(String(seed)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const shape = (seedHash + (FAMILY_SHAPES[family] ?? 0)) % 3;
      geometry = shape === 0
        ? new THREE.IcosahedronGeometry(1.05, 1)
        : shape === 1
          ? new THREE.TorusKnotGeometry(0.72, 0.22, 96, 16)
          : new THREE.DodecahedronGeometry(1.05, 1);

      material = new THREE.MeshStandardMaterial({
        color: rarity === 'legendary' ? 0xffd36a : rarity === 'epic' ? 0xb68cff : 0x55e6ff,
        metalness: 0.72,
        roughness: 0.2,
      });
      group.add(new THREE.Mesh(geometry, material));
      scene.add(group);

      scene.add(new THREE.AmbientLight(0x8fa6ff, 1.5));
      const key = new THREE.PointLight(0x55e6ff, 18, 12);
      key.position.set(2.5, 2.5, 3.5);
      scene.add(key);
      const rim = new THREE.PointLight(0xa183ff, 14, 10);
      rim.position.set(-3, 0.5, -2);
      scene.add(rim);

      const resize = () => {
        const width = Math.max(1, mount.clientWidth || 320);
        const height = Math.max(1, mount.clientHeight || 220);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      resize();
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
      }

      const onPointerDown = event => {
        dragging = true;
        lastX = event.clientX;
        renderer.domElement.setPointerCapture?.(event.pointerId);
      };
      const onPointerMove = event => {
        if (!dragging) return;
        group.rotation.y += (event.clientX - lastX) * 0.012;
        lastX = event.clientX;
      };
      const onPointerUp = event => {
        dragging = false;
        renderer.domElement.releasePointerCapture?.(event.pointerId);
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointercancel', onPointerUp);

      const animate = () => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        if (!dragging) group.rotation.y += 0.004;
        group.rotation.x = Math.sin(Date.now() * 0.0007) * 0.08;
        try {
          renderer.render(scene, camera);
        } catch {
          cancelAnimationFrame(frame);
          showFallback();
        }
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        renderer?.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer?.domElement.removeEventListener('pointermove', onPointerMove);
        renderer?.domElement.removeEventListener('pointerup', onPointerUp);
        renderer?.domElement.removeEventListener('pointercancel', onPointerUp);
        geometry?.dispose();
        material?.dispose();
        renderer?.dispose();
        if (renderer?.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    } catch {
      showFallback();
      if (renderer?.domElement?.parentNode === mount) mount.removeChild(renderer.domElement);
      return undefined;
    }
  }, [family, rarity, seed]);

  return (
    <div
      className="preview"
      ref={mountRef}
      role="img"
      aria-label={`Interactive 3D ${family} collectible preview`}
      style={{ minHeight: 220, width: '100%', overflow: 'hidden', borderRadius: 14, position: 'relative' }}
    >
      {fallback && (
        <div
          role="status"
          style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center', color: '#bfc7dc', background: 'radial-gradient(circle at 50% 35%, rgba(85,230,255,.1), transparent 65%)' }}
        >
          <div>
            <strong style={{ display: 'block', color: '#fff', marginBottom: 6 }}>3D preview unavailable</strong>
            <span style={{ fontSize: 12 }}>Your device or browser could not start WebGL. The collectible record is still safe.</span>
          </div>
        </div>
      )}
    </div>
  );
}

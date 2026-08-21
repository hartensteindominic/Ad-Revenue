'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function QuantumVault() {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05060b');
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2.8, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setAnimationLoop(null);
    root.replaceChildren(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 2),
      new THREE.MeshStandardMaterial({ color: '#9b7cff', emissive: '#39296e', emissiveIntensity: 0.6, roughness: 0.28, metalness: 0.65 })
    );
    group.add(core);
    const ring = new THREE.Group();
    group.add(ring);
    const assets = [];
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22 + (i % 3) * 0.06, 0),
        new THREE.MeshStandardMaterial({ color: i % 2 ? '#2bd9ff' : '#d8ccff', roughness: 0.3, metalness: 0.7, emissive: i % 2 ? '#0b4150' : '#342e50', emissiveIntensity: 0.35 })
      );
      mesh.position.set(Math.cos(angle) * 2.8, Math.sin(angle * 2) * 0.55, Math.sin(angle) * 2.8);
      ring.add(mesh);
      assets.push(mesh);
    }
    scene.add(new THREE.HemisphereLight('#eee9ff', '#05060b', 2.2));
    const light = new THREE.PointLight('#6f5cff', 8, 30);
    light.position.set(3, 5, 5);
    scene.add(light);

    let frame = 0;
    let running = true;
    const resize = () => {
      const width = Math.max(root.clientWidth, 1);
      const height = Math.max(root.clientHeight, 360);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const animate = () => {
      if (!running) return;
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.0025;
      ring.rotation.y -= 0.004;
      assets.forEach((mesh, index) => { mesh.rotation.x += 0.004 + index * 0.0001; });
      renderer.render(scene, camera);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse(object => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
    };
  }, []);

  return <section style={{ position: 'relative', minHeight: 420, border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, overflow: 'hidden', background: '#05060b' }}>
    <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
    <div style={{ position: 'relative', zIndex: 2, padding: 28, maxWidth: 520, pointerEvents: 'none' }}>
      <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#bdb4ff', fontWeight: 800 }}>QUANTUM VAULT · RESEARCH MODE</div>
      <h2 style={{ fontSize: 'clamp(2rem,6vw,4.4rem)', lineHeight: .95, margin: '12px 0', letterSpacing: '-.05em' }}>The gallery is becoming a system.</h2>
      <p style={{ color: '#a7adbd', lineHeight: 1.7 }}>A provider-neutral research surface for optimization, mission scheduling, procedural discovery and future quantum integrations.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}><span style={pill}>SIMULATION</span><span style={pill}>DETERMINISTIC</span><span style={pill}>NO WALLET SIGNING</span></div>
    </div>
  </section>;
}

const pill = { border: '1px solid rgba(255,255,255,.12)', background: 'rgba(8,9,16,.7)', borderRadius: 999, padding: '7px 10px', color: '#dcd6ff', fontSize: 9, letterSpacing: '.1em' };

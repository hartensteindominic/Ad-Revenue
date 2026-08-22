'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function material(color, metalness = 0.35, roughness = 0.3, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: emissive ? 0.12 : 0 });
}

function add(g, geometry, mat, p=[0,0,0], r=[0,0,0], s=[1,1,1]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...p);
  mesh.rotation.set(...r);
  mesh.scale.set(...s);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function buildProduct(item = {}) {
  const g = new THREE.Group();
  const name = `${item.name || ''} ${item.type || ''}`.toLowerCase();
  const family = `${item.family || ''}`.toLowerCase();
  const gold = item.material === 'gold';
  const main = material(gold ? 0xd7aa38 : item.material === 'obsidian' ? 0x161a24 : item.material === 'ceramic' ? 0xe9e4da : 0x9da8b8, .82, .2);
  const dark = material(0x0d1018, .72, .2);
  const white = material(0xf3f2ee, .05, .32);
  const glass = material(0x6ec8f5, .16, .08, 0x163d63);
  const accent = material(0x7768ff, .55, .2, 0x30206b);
  const rubber = material(0x252a34, .1, .62);

  if (name.includes('headphone') || family.includes('headphone')) {
    add(g, new THREE.TorusGeometry(1.35, .115, 20, 96, Math.PI), main, [0,.42,0], [Math.PI/2,0,0]);
    for (const x of [-1.34,1.34]) {
      add(g, new THREE.CylinderGeometry(.52,.52,.34,48), dark, [x,.06,0], [Math.PI/2,0,0]);
      add(g, new THREE.TorusGeometry(.39,.075,16,48), accent, [x,.06,.19], [Math.PI/2,0,0]);
      add(g, new THREE.CylinderGeometry(.3,.3,.08,40), rubber, [x,.06,.23], [Math.PI/2,0,0]);
    }
  } else if (name.includes('airpods') || name.includes('earbud')) {
    for (const x of [-.62,.62]) {
      add(g, new THREE.SphereGeometry(.48,32,24), white, [x,.27,0], [0,0,0], [1,.66,1]);
      add(g, new THREE.CapsuleGeometry(.105,.58,10,18), white, [x,-.12,.08]);
      add(g, new THREE.SphereGeometry(.075,16,12), dark, [x,-.39,.08]);
    }
    add(g, new THREE.BoxGeometry(1.72,.92,1.08), white, [0,-.7,0], [0,0,0], [1,.7,.9]);
    add(g, new THREE.BoxGeometry(1.3,.06,.82), glass, [0,-.35,.55]);
  } else if (name.includes('shoe') || name.includes('air force')) {
    add(g, new THREE.SphereGeometry(1,32,24), white, [0,-.05,0], [0,0,0], [2.48,.62,1.08]);
    add(g, new THREE.BoxGeometry(2.75,.28,1.13), white, [0,-.5,0]);
    add(g, new THREE.BoxGeometry(2.25,.08,1.04), rubber, [.18,-.63,0]);
    for (let i=0;i<7;i++) add(g, new THREE.CylinderGeometry(.027,.027,.72,12), dark, [-.78+i*.29,.18,-.53], [Math.PI/2,0,0]);
    add(g, new THREE.TorusGeometry(.32,.045,12,32), accent, [1.18,.15,.05], [Math.PI/2,0,0], [1.4,1,1]);
  } else if (name.includes('iphone') || name.includes('phone')) {
    add(g, new THREE.BoxGeometry(1.45,2.8,.2), main, [0,0,0], [0,.08,0]);
    add(g, new THREE.BoxGeometry(1.23,2.5,.045), glass, [0,0,.125]);
    add(g, new THREE.BoxGeometry(.42,.12,.045), dark, [0,.99,.14]);
    for (const x of [-.43,-.08]) add(g, new THREE.CylinderGeometry(.16,.16,.045,28), dark, [x,1.04,.15], [Math.PI/2,0,0]);
    add(g, new THREE.BoxGeometry(.18,.5,.045), accent, [.38,-.88,.15]);
  } else if (name.includes('playstation')) {
    add(g, new THREE.BoxGeometry(.72,3.65,2.12), white, [0,0,0], [0,.05,0]);
    add(g, new THREE.BoxGeometry(.46,3.36,1.82), glass, [0,0,.08]);
    add(g, new THREE.BoxGeometry(.11,3.1,.08), accent, [0,0,1.02]);
    add(g, new THREE.CylinderGeometry(.18,.18,.08,32), dark, [.24,-1.35,1.05], [Math.PI/2,0,0]);
  } else if (name.includes('gopro') || name.includes('camera')) {
    add(g, new THREE.BoxGeometry(1.85,1.5,.88), dark, [0,0,0]);
    add(g, new THREE.BoxGeometry(.42,.28,.08), main, [.52,.54,.48]);
    add(g, new THREE.CylinderGeometry(.5,.5,.32,48), glass, [0,0,.55], [Math.PI/2,0,0]);
    add(g, new THREE.TorusGeometry(.33,.045,12,40), accent, [0,0,.73], [Math.PI/2,0,0]);
  } else if (name.includes('watch') || name.includes('submariner')) {
    add(g, new THREE.CylinderGeometry(.8,.8,.23,64), main, [0,.2,0], [Math.PI/2,0,0]);
    add(g, new THREE.CylinderGeometry(.67,.67,.055,64), glass, [0,.2,.14], [Math.PI/2,0,0]);
    add(g, new THREE.TorusGeometry(.58,.08,12,64), dark, [0,.2,.18], [Math.PI/2,0,0]);
    add(g, new THREE.BoxGeometry(.22,1.72,.09), rubber, [0,-.9,0]);
    add(g, new THREE.BoxGeometry(.22,1.72,.09), rubber, [0,1.3,0]);
    add(g, new THREE.TorusGeometry(.48,.025,8,48), accent, [0,.2,.19], [Math.PI/2,0,0]);
  } else if (name.includes('eyewear') || name.includes('wayfarer') || family.includes('eyewear')) {
    for (const x of [-.62,.62]) {
      add(g, new THREE.TorusGeometry(.45,.08,16,48), dark, [x,0,0], [Math.PI/2,0,0]);
      add(g, new THREE.PlaneGeometry(.7,.7), glass, [x,0,.02]);
    }
    add(g, new THREE.BoxGeometry(1.15,.08,.08), dark);
    add(g, new THREE.BoxGeometry(.08,.08,.8), dark, [-1.05,0,0]);
    add(g, new THREE.BoxGeometry(.08,.08,.8), dark, [1.05,0,0]);
  } else if (name.includes('tumbler') || name.includes('stanley') || name.includes('bottle')) {
    add(g, new THREE.CylinderGeometry(.78,.92,2.7,48), main);
    add(g, new THREE.TorusGeometry(.73,.065,14,56), dark, [0,1.15,0]);
    add(g, new THREE.CylinderGeometry(.52,.52,.08,40), dark, [0,1.4,0]);
    add(g, new THREE.TorusGeometry(.36,.045,12,40), accent, [0,1.43,0]);
    add(g, new THREE.BoxGeometry(.16,.62,.16), main, [.43,.9,0], [0,0,-.3]);
  } else {
    add(g, new THREE.CylinderGeometry(.78,.92,2.7,48), main);
    add(g, new THREE.TorusGeometry(.72,.06,14,48), dark, [0,1.15,0]);
    add(g, new THREE.CylinderGeometry(.5,.5,.08,40), dark, [0,1.4,0]);
  }
  return g;
}

function TwinFallback({ item, hidden }) {
  return (
    <div
      className="vv3-twinFallback"
      role="img"
      aria-label={`${item?.name || 'Real-world object'} 3D NFT digital twin`}
      aria-hidden={hidden ? 'true' : undefined}
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
    >
      <div className="vv3-twinFallbackOrb" aria-hidden="true" />
      <span>3D DIGITAL TWIN</span>
      <small>Interactive model loading</small>
    </div>
  );
}

export default function Product3DTwin({ item, hero=false }) {
  const host = useRef(null);
  const [active, setActive] = useState(hero);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = host.current;
    if (!root || hero) return undefined;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '240px' });
    observer.observe(root);
    return () => observer.disconnect();
  }, [hero]);

  useEffect(() => {
    const root = host.current;
    if (!root || !active) return undefined;
    let mounted = true;
    let renderer, scene, camera, controls, raf, ro, object;

    const showFallback = () => {
      if (mounted) setReady(false);
    };

    try {
      const lowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.hardwareConcurrency || 4) <= 4;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(29, 1, .1, 100);
      renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hero ? (lowPower ? 1.15 : 1.55) : (lowPower ? 1.05 : 1.3)));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = !lowPower;
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.addEventListener('webglcontextlost', showFallback, { passive: true });
      root.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x10121d, 2.0));
      const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(4,7,6); key.castShadow = true; scene.add(key);
      const rim = new THREE.DirectionalLight(0x8b6dff, 2.1); rim.position.set(-5,3,-5); scene.add(rim);
      const fill = new THREE.PointLight(0x35a7ff, 1.25, 14); fill.position.set(3,-1,4); scene.add(fill);

      const floor = new THREE.Mesh(new THREE.CircleGeometry(3.5,72), new THREE.MeshStandardMaterial({ color:0x090c16, roughness:.82, metalness:.12 }));
      floor.rotation.x = -Math.PI/2; floor.position.y = -1.72; floor.receiveShadow = true; scene.add(floor);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55,.014,10,120), new THREE.MeshBasicMaterial({ color:0x7566ff, transparent:true, opacity:.34 }));
      ring.rotation.x = -Math.PI/2; ring.position.y = -1.69; scene.add(ring);

      object = buildProduct(item); scene.add(object);
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center); object.position.y += .1;
      const maxDim = Math.max(size.x,size.y,size.z,1);
      camera.position.set(maxDim*.7,.25,Math.max(hero ? 6.6 : 5.5,maxDim*2.55));
      camera.lookAt(0,.05,0);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = .075; controls.enablePan = false;
      controls.minDistance = Math.max(3,maxDim*1.35); controls.maxDistance = Math.max(10,maxDim*4.3);
      controls.autoRotate = !lowPower; controls.autoRotateSpeed = .55; controls.target.set(0,.05,0);

      const resize = () => {
        if (!mounted || !root || !renderer || !camera) return;
        const w = Math.max(root.clientWidth,1), h = Math.max(root.clientHeight, hero ? 390 : 300);
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);
      };
      resize();
      ro = new ResizeObserver(resize); ro.observe(root);
      const animate = () => {
        if (!mounted) return;
        raf = requestAnimationFrame(animate);
        controls.update(); renderer.render(scene,camera);
      };
      animate();
      if (mounted) setReady(true);
    } catch {
      showFallback();
    }

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      renderer?.domElement?.removeEventListener('webglcontextlost', showFallback);
      scene?.traverse((o) => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose?.();
      });
      renderer?.dispose();
      if (renderer?.domElement?.parentNode === root) root.removeChild(renderer.domElement);
      object = null;
    };
  }, [item, hero, active]);

  return (
    <div ref={host} style={{ width:'100%', height:'100%', minHeight:hero ? 390 : 300, position:'relative', overflow:'hidden', borderRadius:'inherit' }}>
      <TwinFallback item={item} hidden={ready} />
    </div>
  );
}

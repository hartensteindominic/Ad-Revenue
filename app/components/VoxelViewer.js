'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generateVoxelAsset } from '@/lib/nft-engine';

const DEFAULT_RARITY = {
  car: 'Epic', villa: 'Legendary', owl: 'Rare', fox: 'Rare', robot: 'Rare',
  statue: 'Legendary', ship: 'Epic', tree: 'Rare', dragon: 'Mythic', mech: 'Legendary',
  crystal: 'Epic', portal: 'Legendary', temple: 'Epic', motorcycle: 'Rare',
  alien: 'Epic', jewelry: 'Legendary', abstract: 'Mythic', sword: 'Epic',
  fortress: 'Legendary', mushroom: 'Rare', satellite: 'Rare', totem: 'Epic',
};

// Different primitive geometry per material family → real visual style change, not recolor
const MATERIAL_PRIMITIVE = {
  chrome: 'box', metallic: 'box', gold: 'box', weathered: 'box',
  glass: 'sphere', crystal: 'octa', ice: 'octa', holographic: 'octa',
  organic: 'sphere', wood: 'box', stone: 'box', ceramic: 'sphere',
  neon: 'box', lava: 'sphere', default: 'box',
};

const MATERIAL_SURFACE = {
  chrome: { roughness: 0.12, metalness: 0.92 },
  metallic: { roughness: 0.22, metalness: 0.85 },
  gold: { roughness: 0.18, metalness: 0.95 },
  glass: { roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.72 },
  crystal: { roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.85 },
  ice: { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8 },
  holographic: { roughness: 0.15, metalness: 0.7, emissiveIntensity: 0.35 },
  neon: { roughness: 0.2, metalness: 0.4, emissiveIntensity: 0.55 },
  organic: { roughness: 0.75, metalness: 0.05 },
  wood: { roughness: 0.85, metalness: 0.02 },
  stone: { roughness: 0.9, metalness: 0.05 },
  ceramic: { roughness: 0.35, metalness: 0.1 },
  weathered: { roughness: 0.88, metalness: 0.25 },
  lava: { roughness: 0.4, metalness: 0.15, emissiveIntensity: 0.45 },
  default: { roughness: 0.4, metalness: 0.15 },
};

function hashSeed(value) {
  let hash = 2166136261;
  const text = String(value || 'showcase');
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assetSignature(seed) {
  return hashSeed(seed).toString(16).padStart(8, '0').toUpperCase();
}

function makePrimitive(kind, size) {
  if (kind === 'sphere') return new THREE.SphereGeometry(size * 0.55, 10, 8);
  if (kind === 'octa') return new THREE.OctahedronGeometry(size * 0.58, 0);
  return new THREE.BoxGeometry(size, size, size);
}

export default function VoxelViewer({
  shape = 'car',
  compact = false,
  label = true,
  interactive = true,
  showcase = false,
  rarity,
  seed = 'showcase',
  assetUrl = '',
  material,
}) {
  const host = useRef(null);
  const frame = useRef(0);
  const autoRotateRef = useRef(!showcase);
  const gridRef = useRef(false);
  const explodeRef = useRef(false);
  const edgesRef = useRef(true);
  const controlsRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [explode, setExplode] = useState(false);
  const [edges, setEdges] = useState(true);
  const [autoRotate, setAutoRotate] = useState(!showcase);
  const [grid, setGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showcaseMode, setShowcaseMode] = useState(showcase);
  const effectiveRarity = rarity || DEFAULT_RARITY[shape] || 'Rare';

  useEffect(() => {
    if (!host.current) return undefined;

    const root = host.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05060c');
    scene.fog = new THREE.FogExp2('#05060c', compact ? 0.03 : 0.016);

    const fov = compact ? 44 : 32;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75));
    renderer.shadowMap.enabled = !compact;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = compact ? 3.5 : 4.5;
    controls.maxDistance = compact ? 24 : 42;
    controls.enablePan = false;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.55;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight('#e8e4ff', '#070a14', compact ? 2.0 : 2.6));
    const key = new THREE.DirectionalLight('#fff7ea', compact ? 3.4 : 4.6);
    key.position.set(12, 20, 15);
    key.castShadow = !compact;
    scene.add(key);
    const violet = new THREE.PointLight('#7657ff', compact ? 34 : 58, 65, 2);
    violet.position.set(-13, 9, -12);
    scene.add(violet);
    const cyan = new THREE.PointLight('#29d9ff', compact ? 16 : 30, 48, 2);
    cyan.position.set(12, 6, -8);
    scene.add(cyan);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(compact ? 9 : 13, 48),
      new THREE.MeshStandardMaterial({ color: '#080b14', roughness: 0.7, metalness: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.4;
    scene.add(floor);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(compact ? 3.8 : 5.4, compact ? 4.2 : 5.9, 0.22, 48),
      new THREE.MeshStandardMaterial({ color: '#111329', roughness: 0.38, metalness: 0.5, emissive: '#17113a', emissiveIntensity: 0.28 })
    );
    platform.position.y = -2.27;
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(compact ? 3.3 : 4.8, compact ? 3.45 : 4.95, 64),
      new THREE.MeshBasicMaterial({ color: '#8667ff', transparent: true, opacity: 0.48, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.08;
    scene.add(ring);

    const random = seededRandom(`${seed}:${shape}`);
    const starCount = compact ? 80 : 260;
    const stars = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const radius = 14 + random() * 26;
      const theta = random() * Math.PI * 2;
      starPositions[i * 3] = Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = -1 + random() * 20;
      starPositions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    stars.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starField = new THREE.Points(stars, new THREE.PointsMaterial({ color: '#bcb1ff', size: 0.045, transparent: true, opacity: 0.42 }));
    scene.add(starField);

    const group = new THREE.Group();
    scene.add(group);

    const asset = generateVoxelAsset({ shape, seed, rarity: effectiveRarity, material });
    const matKey = asset.material || material || 'default';
    const colors = asset.palette;
    const voxels = asset.voxels;
    const primitive = MATERIAL_PRIMITIVE[matKey] || 'box';
    const surface = MATERIAL_SURFACE[matKey] || MATERIAL_SURFACE.default;
    const voxelSize = compact ? 0.88 : 0.8;

    const geometry = makePrimitive(primitive, voxelSize);
    const wireGeometry = geometry.clone();
    const buckets = new Map();
    voxels.forEach((voxel) => {
      if (!buckets.has(voxel[3])) buckets.set(voxel[3], []);
      buckets.get(voxel[3]).push(voxel);
    });

    const meshes = [];
    const wireMeshes = [];
    const resources = [];
    const box = new THREE.Box3();

    buckets.forEach((arr, colorIndex) => {
      const matOpts = {
        color: colors[colorIndex],
        roughness: surface.roughness,
        metalness: surface.metalness,
      };
      if (surface.transparent) {
        matOpts.transparent = true;
        matOpts.opacity = surface.opacity;
      }
      if (surface.emissiveIntensity) {
        matOpts.emissive = colors[colorIndex];
        matOpts.emissiveIntensity = surface.emissiveIntensity * (colorIndex === 4 ? 1 : 0.4);
      }
      const mat = new THREE.MeshStandardMaterial(matOpts);
      const mesh = new THREE.InstancedMesh(geometry, mat, arr.length);
      mesh.castShadow = !compact;
      mesh.receiveShadow = !compact;
      mesh.frustumCulled = false;
      mesh.userData.voxels = arr;
      mesh.userData.basePositions = arr.map((v) => {
        const position = new THREE.Vector3(v[0] * voxelSize, v[1] * voxelSize - 2.0, v[2] * voxelSize);
        box.expandByPoint(position);
        return position;
      });
      mesh.userData.directions = mesh.userData.basePositions.map((position) => {
        const direction = position.clone().sub(box.getCenter(new THREE.Vector3()));
        if (direction.lengthSq() < 0.001) direction.set(0, 1, 0);
        return direction.normalize();
      });
      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      arr.forEach((_, index) => {
        matrix.compose(mesh.userData.basePositions[index], quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
      meshes.push(mesh);
      resources.push(mat);

      if (primitive === 'box') {
        const wireMaterial = new THREE.MeshBasicMaterial({ color: '#c9bdff', transparent: true, opacity: 0.14, wireframe: true });
        const wire = new THREE.InstancedMesh(wireGeometry, wireMaterial, arr.length);
        wire.frustumCulled = false;
        wire.userData.basePositions = mesh.userData.basePositions;
        wire.userData.directions = mesh.userData.directions;
        arr.forEach((_, index) => {
          matrix.compose(mesh.userData.basePositions[index], quaternion, scale);
          wire.setMatrixAt(index, matrix);
        });
        wire.instanceMatrix.needsUpdate = true;
        group.add(wire);
        wireMeshes.push(wire);
        resources.push(wireMaterial);
      }
    });

    // Intelligent framing from bounding box — model owns the frame
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 2.8);
    const distanceFactor = compact ? 1.05 : 1.22;
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(
      maxDim * distanceFactor * 0.9,
      maxDim * distanceFactor * 0.65,
      maxDim * distanceFactor * 1.0
    ));
    controls.update();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredHit = null;
    let selectedHit = null;
    let explosionAmount = 0;
    let lastExplosion = -1;
    let pulse = 0;
    let gltfScene = null;
    let gltfMixer = null;
    let disposed = false;

    const frameObject = (object) => {
      const bounds = new THREE.Box3().setFromObject(object);
      const objectSize = bounds.getSize(new THREE.Vector3());
      const objectCenter = bounds.getCenter(new THREE.Vector3());
      const dimension = Math.max(objectSize.x, objectSize.y, objectSize.z, 2);
      const factor = compact ? 1.1 : 1.28;
      controls.target.copy(objectCenter);
      camera.position.copy(objectCenter).add(new THREE.Vector3(dimension * factor * 0.9, dimension * factor * 0.65, dimension * factor * 1.0));
      controls.update();
    };

    if (assetUrl) {
      const loader = new GLTFLoader();
      loader.load(assetUrl, (gltf) => {
        if (disposed) return;
        gltfScene = gltf.scene;
        gltfScene.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = !compact;
            object.receiveShadow = !compact;
          }
        });
        group.visible = false;
        scene.add(gltfScene);
        frameObject(gltfScene);
        if (gltf.animations?.length) {
          gltfMixer = new THREE.AnimationMixer(gltfScene);
          gltf.animations.forEach((clip) => gltfMixer.clipAction(clip).play());
        }
      }, undefined, () => {});
    }

    const pointerAt = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitVoxel = (event) => {
      if (!interactive || !group.visible) return null;
      pointerAt(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return hit && hit.instanceId !== undefined ? hit : null;
    };

    const hover = (event) => {
      const hit = hitVoxel(event);
      hoveredHit = hit ? { mesh: hit.object, instanceId: hit.instanceId } : null;
      if (!hit) {
        setHovered(null);
        renderer.domElement.style.cursor = 'grab';
      } else {
        const data = hit.object.userData.voxels[hit.instanceId];
        setHovered({ x: data[0], y: data[1], z: data[2], color: colors[data[3]] });
        renderer.domElement.style.cursor = 'pointer';
      }
    };

    const click = (event) => {
      const hit = hitVoxel(event);
      if (!hit) {
        selectedHit = null;
        setSelected(null);
        return;
      }
      const data = hit.object.userData.voxels[hit.instanceId];
      selectedHit = { mesh: hit.object, instanceId: hit.instanceId };
      setSelected({ x: data[0], y: data[1], z: data[2], color: colors[data[3]] });
    };

    const leave = () => {
      hoveredHit = null;
      setHovered(null);
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointermove', hover);
    renderer.domElement.addEventListener('pointerleave', leave);
    renderer.domElement.addEventListener('click', click);

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      const delta = clock.getDelta();
      const targetExplosion = explodeRef.current ? 1 : 0;
      explosionAmount = THREE.MathUtils.lerp(explosionAmount, targetExplosion, 0.075);
      pulse += delta * 2.4;
      controls.autoRotate = autoRotateRef.current;
      wireMeshes.forEach((wire) => { wire.visible = edgesRef.current && group.visible; });
      ring.material.opacity = 0.4 + Math.sin(pulse) * 0.08;
      starField.rotation.y += delta * 0.008;
      platform.rotation.y += delta * 0.012;
      if (gltfMixer) gltfMixer.update(delta);

      if (Math.abs(explosionAmount - lastExplosion) > 0.0005 && group.visible) {
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        meshes.forEach((mesh) => {
          mesh.userData.basePositions.forEach((base, index) => {
            const direction = mesh.userData.directions[index];
            const position = base.clone().addScaledVector(direction, explosionAmount * 1.9);
            if (hoveredHit?.mesh === mesh && hoveredHit.instanceId === index) position.y += 0.1;
            if (selectedHit?.mesh === mesh && selectedHit.instanceId === index) position.y += 0.18;
            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(index, matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
        });
        wireMeshes.forEach((wire) => {
          wire.userData.basePositions.forEach((base, index) => {
            const position = base.clone().addScaledVector(wire.userData.directions[index], explosionAmount * 1.9);
            matrix.compose(position, quaternion, scale);
            wire.setMatrixAt(index, matrix);
          });
          wire.instanceMatrix.needsUpdate = true;
        });
        lastExplosion = explosionAmount;
      }

      controls.update();
      renderer.render(scene, camera);
      frame.current = requestAnimationFrame(animate);
    };
    animate();

    const fullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', fullscreenChange);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      document.removeEventListener('fullscreenchange', fullscreenChange);
      renderer.domElement.removeEventListener('pointermove', hover);
      renderer.domElement.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('click', click);
      controls.dispose();
      renderer.dispose();
      geometry.dispose();
      wireGeometry.dispose();
      resources.forEach((r) => r.dispose());
      floor.geometry.dispose(); floor.material.dispose();
      platform.geometry.dispose(); platform.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      stars.dispose(); starField.material.dispose();
      if (gltfScene) scene.remove(gltfScene);
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
      controlsRef.current = null;
    };
  }, [shape, compact, interactive, effectiveRarity, seed, assetUrl, material]);

  const setRotation = () => {
    const next = !autoRotate;
    autoRotateRef.current = next;
    setAutoRotate(next);
  };
  const setExploded = () => { const next = !explode; explodeRef.current = next; setExplode(next); };
  const setEdgesMode = () => { const next = !edges; edgesRef.current = next; setEdges(next); };
  const resetView = () => { explodeRef.current = false; setExplode(false); controlsRef.current?.reset(); };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await host.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  return (
    <div className={`voxelViewer ${compact ? 'compact' : ''} ${showcaseMode ? 'showcaseMode' : ''}`} ref={host}>
      {label && (
        <>
          <div className="viewerBadge">3D ASSET · {effectiveRarity.toUpperCase()}</div>
          <div className="dnaBadge">DNA · {assetSignature(seed)}</div>
        </>
      )}
      {interactive && (
        <div className="viewerTools">
          <button type="button" onClick={setRotation}>{autoRotate ? '⏸ Pause' : '▶ Rotate'}</button>
          <button type="button" onClick={setExploded}>{explode ? '🧩 Assemble' : '💥 Explode'}</button>
          <button type="button" onClick={setEdgesMode}>{edges ? '◇ Edges' : '◇ Clean'}</button>
          <button type="button" onClick={resetView}>⌂ Reset</button>
          <button type="button" onClick={toggleFullscreen}>{isFullscreen ? '⤢ Exit' : '⛶ Full'}</button>
        </div>
      )}
      {showcaseMode && <div className="showcaseBadge">✦ SHOWCASE · DRAG TO INSPECT</div>}
      {selected && <div className="voxelInfo"><b>SELECTED</b><span>X {selected.x} · Y {selected.y} · Z {selected.z}</span></div>}
      {hovered && !selected && <div className="voxelHover">{hovered.x},{hovered.y},{hovered.z}</div>}
      <style jsx>{` .viewerTools{position:absolute;top:12px;right:12px;z-index:5;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:360px}.viewerTools button{border:1px solid rgba(255,255,255,.12);background:rgba(6,7,14,.78);color:#fff;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:750;cursor:pointer;backdrop-filter:blur(12px)}.viewerTools button:hover{border-color:#8a6cff;background:rgba(104,75,235,.52)}.voxelInfo,.voxelHover,.dnaBadge,.showcaseBadge{position:absolute;z-index:5;padding:9px 11px;border-radius:11px;background:rgba(6,7,14,.84);border:1px solid rgba(118,89,255,.4);color:#dfe2ff;font-size:11px;font-family:monospace;backdrop-filter:blur(12px)}.voxelInfo{bottom:12px;left:12px}.voxelHover{bottom:12px;left:12px}.dnaBadge{right:12px;bottom:12px;font-size:8px;letter-spacing:1px;color:#b5a8ff}.showcaseBadge{left:50%;top:12px;transform:translateX(-50%);font-size:8px;letter-spacing:1.4px;color:#e1dcff;white-space:nowrap}.showcaseMode canvas{filter:saturate(1.1) contrast(1.04)}.compact .viewerTools{transform:scale(.85);transform-origin:top right} `}</style>
    </div>
  );
}

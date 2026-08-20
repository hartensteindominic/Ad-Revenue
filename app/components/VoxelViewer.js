'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { generateVoxelAsset } from '@/lib/nft-engine';

const DEFAULT_RARITY = {
  car: 'Epic', villa: 'Legendary', owl: 'Rare', fox: 'Rare', robot: 'Rare',
  statue: 'Legendary', ship: 'Epic', tree: 'Rare',
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

export default function VoxelViewer({
  shape = 'car',
  compact = false,
  label = true,
  interactive = true,
  showcase = false,
  rarity,
  seed = 'showcase',
  assetUrl = '',
}) {
  const host = useRef(null);
  const frame = useRef(0);
  const autoRotateRef = useRef(!showcase);
  const gridRef = useRef(false);
  const explodeRef = useRef(false);
  const edgesRef = useRef(true);
  const controlsRef = useRef(null);
  const selectedRef = useRef(null);
  const hoveredRef = useRef(null);

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
    scene.fog = new THREE.FogExp2('#05060c', 0.017);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = !compact;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.domElement.setAttribute('aria-label', 'Interactive Voxel Vault 3D asset viewer');
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 6;
    controls.maxDistance = 58;
    controls.enablePan = false;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.58;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight('#e8e4ff', '#070a14', compact ? 1.7 : 2.5));
    const key = new THREE.DirectionalLight('#fff7ea', compact ? 2.8 : 4.5);
    key.position.set(12, 20, 15);
    key.castShadow = !compact;
    if (!compact) key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const violet = new THREE.PointLight('#7657ff', compact ? 28 : 55, 65, 2);
    violet.position.set(-13, 9, -12);
    scene.add(violet);
    const cyan = new THREE.PointLight('#29d9ff', compact ? 14 : 28, 48, 2);
    cyan.position.set(12, 6, -8);
    scene.add(cyan);
    const warm = new THREE.PointLight('#ff7bcb', compact ? 9 : 18, 42, 2);
    warm.position.set(0, 4, 15);
    scene.add(warm);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, compact ? 48 : 72),
      new THREE.MeshStandardMaterial({ color: '#080b14', roughness: 0.7, metalness: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.4;
    floor.receiveShadow = !compact;
    scene.add(floor);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(6.6, 7.2, 0.28, compact ? 48 : 72),
      new THREE.MeshStandardMaterial({ color: '#111329', roughness: 0.38, metalness: 0.5, emissive: '#17113a', emissiveIntensity: 0.28 })
    );
    platform.position.y = -2.27;
    platform.receiveShadow = !compact;
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(5.75, 5.9, compact ? 64 : 96),
      new THREE.MeshBasicMaterial({ color: '#8667ff', transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.08;
    scene.add(ring);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.3, 4.34, compact ? 64 : 96),
      new THREE.MeshBasicMaterial({ color: '#28d9ff', transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = -2.07;
    scene.add(innerRing);

    const gridHelper = new THREE.GridHelper(28, 28, '#30285a', '#15192a');
    gridHelper.position.y = -2.04;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.38;
    scene.add(gridHelper);

    const random = seededRandom(`${seed}:${shape}`);
    const starCount = compact ? 150 : 360;
    const stars = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const radius = 18 + random() * 34;
      const theta = random() * Math.PI * 2;
      starPositions[i * 3] = Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = -1 + random() * 28;
      starPositions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    stars.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starField = new THREE.Points(stars, new THREE.PointsMaterial({ color: '#bcb1ff', size: compact ? 0.045 : 0.055, transparent: true, opacity: 0.5 }));
    scene.add(starField);

    const group = new THREE.Group();
    scene.add(group);
    const highlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.82),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.78, wireframe: true })
    );
    highlight.visible = false;
    scene.add(highlight);

    const geometry = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    const wireGeometry = geometry.clone();
    const buckets = new Map();
    const asset = generateVoxelAsset({ shape, seed, rarity: effectiveRarity });
    const colors = asset.palette;
    const voxels = asset.voxels;
    voxels.forEach((voxel) => {
      if (!buckets.has(voxel[3])) buckets.set(voxel[3], []);
      buckets.get(voxel[3]).push(voxel);
    });

    const meshes = [];
    const wireMeshes = [];
    const resources = [];
    const box = new THREE.Box3();

    buckets.forEach((arr, colorIndex) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        roughness: colorIndex === 3 ? 0.26 : 0.43,
        metalness: colorIndex === 3 ? 0.28 : 0.08,
      });
      const mesh = new THREE.InstancedMesh(geometry, material, arr.length);
      mesh.castShadow = !compact;
      mesh.receiveShadow = !compact;
      mesh.frustumCulled = false;
      mesh.userData.voxels = arr;
      mesh.userData.basePositions = arr.map((v) => {
        const position = new THREE.Vector3(v[0] * 0.76, v[1] * 0.76 - 2.1, v[2] * 0.76);
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
      resources.push(material);

      const wireMaterial = new THREE.MeshBasicMaterial({ color: '#c9bdff', transparent: true, opacity: 0.18, wireframe: true });
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
    });

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 4);
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(maxDim * 1.55, maxDim * 1.05, maxDim * 1.75));
    controls.update();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredHit = null;
    let selectedHit = null;
    let explosionAmount = 0;
    let lastExplosion = -1;
    let lastHighlightKey = '';
    let pulse = 0;
    let gltfScene = null;
    let gltfMixer = null;
    let disposed = false;

    const frameObject = (object) => {
      const bounds = new THREE.Box3().setFromObject(object);
      const objectSize = bounds.getSize(new THREE.Vector3());
      const objectCenter = bounds.getCenter(new THREE.Vector3());
      const dimension = Math.max(objectSize.x, objectSize.y, objectSize.z, 2);
      controls.target.copy(objectCenter);
      camera.position.copy(objectCenter).add(new THREE.Vector3(dimension * 1.55, dimension * 1.05, dimension * 1.75));
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

    const updateHighlight = () => {
      const hit = selectedHit || hoveredHit;
      if (!hit) {
        highlight.visible = false;
        return;
      }
      const base = hit.mesh.userData.basePositions[hit.instanceId];
      const direction = hit.mesh.userData.directions[hit.instanceId];
      highlight.position.copy(base).addScaledVector(direction, explosionAmount * 1.9);
      highlight.position.y += selectedHit === hit ? 0.18 : 0.1;
      highlight.scale.setScalar(selectedHit === hit ? 1.12 + Math.sin(pulse * 2.5) * 0.03 : 1.02);
      highlight.visible = true;
    };

    const hover = (event) => {
      const hit = hitVoxel(event);
      hoveredHit = hit ? { mesh: hit.object, instanceId: hit.instanceId } : null;
      hoveredRef.current = hoveredHit;
      if (!hit) {
        setHovered(null);
        renderer.domElement.style.cursor = 'grab';
      } else {
        const data = hit.object.userData.voxels[hit.instanceId];
        setHovered({ x: data[0], y: data[1], z: data[2], color: colors[data[3]], instance: hit.instanceId });
        renderer.domElement.style.cursor = 'pointer';
      }
    };

    const click = (event) => {
      const hit = hitVoxel(event);
      if (!hit) {
        selectedHit = null;
        selectedRef.current = null;
        setSelected(null);
        return;
      }
      const data = hit.object.userData.voxels[hit.instanceId];
      selectedHit = { mesh: hit.object, instanceId: hit.instanceId };
      selectedRef.current = selectedHit;
      setSelected({ x: data[0], y: data[1], z: data[2], color: colors[data[3]], instance: hit.instanceId });
    };

    const leave = () => {
      hoveredHit = null;
      hoveredRef.current = null;
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
      gridHelper.visible = gridRef.current && !assetUrl;
      wireMeshes.forEach((wire) => { wire.visible = edgesRef.current && group.visible; });
      ring.material.opacity = 0.42 + Math.sin(pulse) * 0.08;
      innerRing.material.opacity = 0.14 + Math.sin(pulse * 1.7) * 0.05;
      starField.rotation.y += delta * 0.008;
      platform.rotation.y += delta * 0.012;
      if (gltfMixer) gltfMixer.update(delta);

      const animationChanged = Math.abs(explosionAmount - lastExplosion) > 0.0005;
      const highlightKey = `${hoveredHit?.mesh?.id || 0}:${hoveredHit?.instanceId ?? -1}:${selectedHit?.mesh?.id || 0}:${selectedHit?.instanceId ?? -1}`;
      if (animationChanged || highlightKey !== lastHighlightKey) {
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        if (group.visible) {
          meshes.forEach((mesh) => {
            mesh.userData.basePositions.forEach((base, index) => {
              const direction = mesh.userData.directions[index];
              const position = base.clone().addScaledVector(direction, explosionAmount * 1.9);
              if (hoveredHit?.mesh === mesh && hoveredHit.instanceId === index) position.y += 0.1 + Math.sin(pulse * 3) * 0.025;
              if (selectedHit?.mesh === mesh && selectedHit.instanceId === index) position.y += 0.18 + Math.sin(pulse * 2.5) * 0.04;
              matrix.compose(position, quaternion, scale);
              mesh.setMatrixAt(index, matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
          });
          wireMeshes.forEach((wire) => {
            wire.userData.basePositions.forEach((base, index) => {
              const position = base.clone().addScaledVector(wire.userData.directions[index], explosionAmount * 1.9);
              if (hoveredHit?.mesh === wire && hoveredHit.instanceId === index) position.y += 0.1;
              if (selectedHit?.mesh === wire && selectedHit.instanceId === index) position.y += 0.18;
              matrix.compose(position, quaternion, scale);
              wire.setMatrixAt(index, matrix);
            });
            wire.instanceMatrix.needsUpdate = true;
          });
        }
        updateHighlight();
        lastExplosion = explosionAmount;
        lastHighlightKey = highlightKey;
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
      resources.forEach((resource) => resource.dispose());
      floor.geometry.dispose(); floor.material.dispose();
      platform.geometry.dispose(); platform.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      innerRing.geometry.dispose(); innerRing.material.dispose();
      gridHelper.geometry.dispose(); gridHelper.material.dispose();
      stars.dispose(); starField.material.dispose();
      highlight.geometry.dispose(); highlight.material.dispose();
      if (gltfScene) scene.remove(gltfScene);
      root.removeChild(renderer.domElement);
      controlsRef.current = null;
    };
  }, [shape, compact, interactive, effectiveRarity, seed, assetUrl]);

  const setRotation = () => {
    const next = !autoRotate;
    autoRotateRef.current = next;
    setAutoRotate(next);
    if (showcaseMode && !next) setShowcaseMode(false);
  };
  const setGridMode = () => { const next = !grid; gridRef.current = next; setGrid(next); };
  const setExploded = () => { const next = !explode; explodeRef.current = next; setExplode(next); };
  const setEdgesMode = () => { const next = !edges; edgesRef.current = next; setEdges(next); };
  const resetView = () => { explodeRef.current = false; setExplode(false); controlsRef.current?.reset(); };
  const toggleShowcase = () => {
    const next = !showcaseMode;
    setShowcaseMode(next);
    autoRotateRef.current = next;
    setAutoRotate(next);
    gridRef.current = false;
    setGrid(false);
    edgesRef.current = true;
    setEdges(true);
    explodeRef.current = false;
    setExplode(false);
    controlsRef.current?.reset();
  };
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
          <div className="viewerBadge">REAL 3D VOXEL · {effectiveRarity.toUpperCase()} · {seed.toUpperCase()}</div>
          <div className="dnaBadge">DNA · DETERMINISTIC · {assetSignature(seed)}</div>
        </>
      )}
      {interactive && (
        <div className="viewerTools">
          <button type="button" onClick={setRotation}>{autoRotate ? '⏸ Pause' : '▶ Rotate'}</button>
          <button type="button" onClick={setExploded}>{explode ? '🧩 Assemble' : '💥 Explode'}</button>
          {!assetUrl && <button type="button" onClick={setGridMode}>▦ Grid</button>}
          <button type="button" onClick={setEdgesMode}>{edges ? '◇ Edges' : '◇ Clean'}</button>
          <button type="button" onClick={resetView}>⌂ Reset</button>
          <button type="button" onClick={toggleShowcase}>{showcaseMode ? '✦ Exit Showcase' : '✦ Showcase'}</button>
          <button type="button" onClick={toggleFullscreen}>{isFullscreen ? '⤢ Exit' : '⛶ Fullscreen'}</button>
        </div>
      )}
      {showcaseMode && <div className="showcaseBadge">✦ SHOWCASE MODE · LIVING 3D ASSET · DRAG TO INSPECT</div>}
      {selected && <div className="voxelInfo"><b>VOXEL SELECTED</b><span>X {selected.x} · Y {selected.y} · Z {selected.z}</span><span><i style={{ background: selected.color }} /> {selected.color}</span></div>}
      {hovered && !selected && <div className="voxelHover">VOXEL {hovered.x},{hovered.y},{hovered.z}</div>}
      <style jsx>{` .viewerTools{position:absolute;top:12px;right:12px;z-index:5;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:390px}.viewerTools button{border:1px solid rgba(255,255,255,.12);background:rgba(6,7,14,.78);color:#fff;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:750;cursor:pointer;backdrop-filter:blur(12px);transition:transform .16s ease,border-color .16s ease,background .16s ease}.viewerTools button:hover{border-color:#8a6cff;background:rgba(104,75,235,.52);transform:translateY(-1px)}.voxelInfo,.voxelHover,.dnaBadge,.showcaseBadge{position:absolute;z-index:5;padding:9px 11px;border-radius:11px;background:rgba(6,7,14,.84);border:1px solid rgba(118,89,255,.4);color:#dfe2ff;font-size:11px;font-family:monospace;backdrop-filter:blur(12px);display:flex;gap:8px;flex-wrap:wrap}.voxelInfo{bottom:12px;left:12px}.voxelInfo b{width:100%;color:#fff}.voxelInfo i{display:inline-block;width:9px;height:9px;border-radius:3px;vertical-align:-1px}.voxelHover{bottom:12px;left:12px;pointer-events:none}.dnaBadge{right:12px;bottom:12px;font-size:8px;letter-spacing:1px;color:#b5a8ff}.showcaseBadge{left:50%;top:12px;transform:translateX(-50%);font-size:8px;letter-spacing:1.4px;color:#e1dcff;border-color:rgba(154,124,255,.55);white-space:nowrap}.showcaseMode canvas{filter:saturate(1.12) contrast(1.05)}.compact .viewerTools{transform:scale(.86);transform-origin:top right}.compact .voxelInfo,.compact .voxelHover{font-size:9px;padding:6px 8px}@media(max-width:600px){.viewerTools{max-width:220px}.viewerTools button{font-size:10px;padding:7px 8px}.showcaseBadge{max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}.voxelInfo{max-width:calc(100% - 24px)}} `}</style>
    </div>
  );
}

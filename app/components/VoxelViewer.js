'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateVoxelAsset } from '@/lib/nft-engine';

const DEFAULT_RARITY = {
  car: 'Epic', villa: 'Legendary', owl: 'Rare', fox: 'Rare', robot: 'Rare',
  statue: 'Legendary', ship: 'Epic', tree: 'Rare',
};

export default function VoxelViewer({
  shape = 'car',
  compact = false,
  label = true,
  interactive = true,
  showcase = false,
  rarity,
  seed = 'showcase',
}) {
  const host = useRef(null);
  const frame = useRef(0);
  const autoRotateRef = useRef(!showcase);
  const gridRef = useRef(false);
  const explodeTargetRef = useRef(false);
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
    scene.fog = new THREE.FogExp2('#05060c', 0.018);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 7;
    controls.maxDistance = 58;
    controls.enablePan = false;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.65;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight('#dcd8ff', '#080b15', 2.5));
    const key = new THREE.DirectionalLight('#fff7ea', 4.5);
    key.position.set(12, 20, 15);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const violet = new THREE.PointLight('#7657ff', 55, 65, 2);
    violet.position.set(-13, 9, -12);
    scene.add(violet);
    const cyan = new THREE.PointLight('#29d9ff', 28, 48, 2);
    cyan.position.set(12, 6, -8);
    scene.add(cyan);
    const warm = new THREE.PointLight('#ff7bcb', 18, 42, 2);
    warm.position.set(0, 4, 15);
    scene.add(warm);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 96),
      new THREE.MeshStandardMaterial({ color: '#080b14', roughness: 0.7, metalness: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.4;
    floor.receiveShadow = true;
    scene.add(floor);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(6.6, 7.2, 0.28, 96),
      new THREE.MeshStandardMaterial({ color: '#111329', roughness: 0.38, metalness: 0.5, emissive: '#17113a', emissiveIntensity: 0.28 })
    );
    platform.position.y = -2.27;
    platform.receiveShadow = true;
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(5.75, 5.9, 128),
      new THREE.MeshBasicMaterial({ color: '#8667ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.08;
    scene.add(ring);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.3, 4.34, 128),
      new THREE.MeshBasicMaterial({ color: '#28d9ff', transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = -2.07;
    scene.add(innerRing);

    const gridHelper = new THREE.GridHelper(28, 28, '#30285a', '#15192a');
    gridHelper.position.y = -2.04;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.42;
    scene.add(gridHelper);

    const stars = new THREE.BufferGeometry();
    const starPositions = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i += 1) {
      const radius = 18 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const y = -1 + Math.random() * 28;
      starPositions[i * 3] = Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    stars.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starField = new THREE.Points(stars, new THREE.PointsMaterial({ color: '#bcb1ff', size: 0.055, transparent: true, opacity: 0.55 }));
    scene.add(starField);

    const group = new THREE.Group();
    scene.add(group);

    const asset = generateVoxelAsset({ shape, seed, rarity: effectiveRarity });
    const colors = asset.palette;
    const voxels = asset.voxels;
    const geometry = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const buckets = new Map();
    voxels.forEach((v) => {
      if (!buckets.has(v[3])) buckets.set(v[3], []);
      buckets.get(v[3]).push(v);
    });

    const meshes = [];
    const edgeMeshes = [];
    const materials = [];

    buckets.forEach((arr, colorIndex) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        roughness: colorIndex === 3 ? 0.28 : 0.43,
        metalness: colorIndex === 3 ? 0.25 : 0.08,
        emissive: colors[colorIndex],
        emissiveIntensity: 0,
      });
      materials.push(material);

      const mesh = new THREE.InstancedMesh(geometry, material, arr.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.userData.voxels = arr;
      mesh.userData.basePositions = arr.map((v) => new THREE.Vector3(v[0] * 0.76, v[1] * 0.76 - 2.1, v[2] * 0.76));
      mesh.userData.color = colors[colorIndex];

      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      arr.forEach((v, i) => {
        matrix.compose(mesh.userData.basePositions[i], quaternion, scale);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
      meshes.push(mesh);

      const edgeMaterial = new THREE.LineBasicMaterial({ color: '#c9bdff', transparent: true, opacity: 0.2 });
      const line = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      line.userData.mesh = mesh;
      line.userData.basePositions = mesh.userData.basePositions;
      line.userData.count = arr.length;
      group.add(line);
      edgeMeshes.push(line);
    });

    const box = new THREE.Box3();
    voxels.forEach((v) => box.expandByPoint(new THREE.Vector3(v[0] * 0.76, v[1] * 0.76 - 2.1, v[2] * 0.76)));
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(maxDim * 1.55, maxDim * 1.05, maxDim * 1.75));
    controls.update();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredHit = null;
    let selectedHit = null;
    let explosionAmount = 0;
    let pulse = 0;

    const pointerAt = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const resetGlow = () => materials.forEach((material) => { material.emissiveIntensity = 0; });

    const hitVoxel = (event) => {
      pointerAt(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return hit && hit.instanceId !== undefined ? hit : null;
    };

    const hover = (event) => {
      if (!interactive) return;
      const hit = hitVoxel(event);
      resetGlow();
      if (!hit) {
        hoveredHit = null;
        hoveredRef.current = null;
        setHovered(null);
        renderer.domElement.style.cursor = 'grab';
        return;
      }
      const data = hit.object.userData.voxels[hit.instanceId];
      hoveredHit = { mesh: hit.object, instanceId: hit.instanceId };
      hoveredRef.current = hoveredHit;
      hit.object.material.emissiveIntensity = 0.28;
      setHovered({ x: data[0], y: data[1], z: data[2], color: colors[data[3]], instance: hit.instanceId });
      renderer.domElement.style.cursor = 'pointer';
    };

    const click = (event) => {
      if (!interactive) return;
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

    renderer.domElement.addEventListener('pointermove', hover);
    renderer.domElement.addEventListener('pointerleave', () => { resetGlow(); setHovered(null); hoveredHit = null; });
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

    const animate = () => {
      const targetExplosion = explodeTargetRef.current ? 1 : 0;
      explosionAmount = THREE.MathUtils.lerp(explosionAmount, targetExplosion, 0.065);
      pulse += 0.018;
      controls.autoRotate = autoRotateRef.current;
      gridHelper.visible = gridRef.current;
      edgeMeshes.forEach((edge) => { edge.visible = edgesRef.current; });
      ring.material.opacity = 0.42 + Math.sin(pulse) * 0.1;
      innerRing.material.opacity = 0.14 + Math.sin(pulse * 1.7) * 0.06;
      starField.rotation.y += 0.00018;
      platform.rotation.y += 0.00022;

      group.children.forEach((object) => {
        const positions = object.userData.basePositions;
        if (!positions) return;
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        positions.forEach((base, index) => {
          const direction = base.clone().sub(center);
          if (direction.lengthSq() < 0.001) direction.set(0, 1, 0);
          direction.normalize();
          const distance = 1.9 * explosionAmount;
          let lift = 0;
          if (hoveredHit && hoveredHit.mesh === object && hoveredHit.instanceId === index) lift = 0.13 + Math.sin(pulse * 3) * 0.035;
          if (selectedHit && selectedHit.mesh === object && selectedHit.instanceId === index) lift = 0.2 + Math.sin(pulse * 2.5) * 0.045;
          const position = base.clone().addScaledVector(direction, distance);
          position.y += lift;
          if (object.isInstancedMesh) {
            matrix.compose(position, quaternion, scale);
            object.setMatrixAt(index, matrix);
          }
        });
        if (object.isInstancedMesh) object.instanceMatrix.needsUpdate = true;
      });

      controls.update();
      renderer.render(scene, camera);
      frame.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', hover);
      renderer.domElement.removeEventListener('click', click);
      renderer.dispose();
      geometry.dispose();
      edgeGeometry.dispose();
      materials.forEach((material) => material.dispose());
      edgeMeshes.forEach((edge) => edge.material.dispose());
      floor.geometry.dispose(); floor.material.dispose();
      platform.geometry.dispose(); platform.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      innerRing.geometry.dispose(); innerRing.material.dispose();
      gridHelper.geometry.dispose(); gridHelper.material.dispose();
      stars.dispose(); starField.material.dispose();
      root.removeChild(renderer.domElement);
      controlsRef.current = null;
    };
  }, [shape, interactive, effectiveRarity, seed]);

  const setRotation = () => {
    const next = !autoRotate;
    autoRotateRef.current = next;
    setAutoRotate(next);
    if (showcaseMode) setShowcaseMode(false);
  };
  const setGridMode = () => { const next = !grid; gridRef.current = next; setGrid(next); };
  const setExploded = () => { const next = !explode; explodeTargetRef.current = next; setExplode(next); };
  const setEdgesMode = () => { const next = !edges; edgesRef.current = next; setEdges(next); };
  const resetView = () => { explodeTargetRef.current = false; setExplode(false); controlsRef.current?.reset(); };
  const toggleShowcase = () => {
    const next = !showcaseMode;
    setShowcaseMode(next);
    autoRotateRef.current = next;
    setAutoRotate(next);
    gridRef.current = false;
    setGrid(false);
    edgesRef.current = true;
    setEdges(true);
    explodeTargetRef.current = false;
    setExplode(false);
    controlsRef.current?.reset();
  };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await host.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
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
          <button type="button" onClick={setGridMode}>▦ Grid</button>
          <button type="button" onClick={setEdgesMode}>{edges ? '◇ Edges' : '◇ Clean'}</button>
          <button type="button" onClick={resetView}>⌂ Reset</button>
          <button type="button" onClick={toggleShowcase}>{showcaseMode ? '✦ Exit Showcase' : '✦ Showcase'}</button>
          <button type="button" onClick={toggleFullscreen}>{isFullscreen ? '⤢ Exit' : '⛶ Fullscreen'}</button>
        </div>
      )}
      {showcaseMode && <div className="showcaseBadge">✦ SHOWCASE MODE · LIVING 3D ASSET · DRAG TO INSPECT</div>}
      {selected && (
        <div className="voxelInfo">
          <b>VOXEL SELECTED</b>
          <span>X {selected.x} · Y {selected.y} · Z {selected.z}</span>
          <span><i style={{ background: selected.color }} /> {selected.color}</span>
        </div>
      )}
      {hovered && !selected && <div className="voxelHover">VOXEL {hovered.x},{hovered.y},{hovered.z}</div>}
      <style jsx>{`
        .viewerTools{position:absolute;top:12px;right:12px;z-index:5;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:390px}.viewerTools button{border:1px solid rgba(255,255,255,.12);background:rgba(6,7,14,.78);color:#fff;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:750;cursor:pointer;backdrop-filter:blur(12px);transition:transform .16s ease,border-color .16s ease,background .16s ease}.viewerTools button:hover{border-color:#8a6cff;background:rgba(104,75,235,.52);transform:translateY(-1px)}.voxelInfo,.voxelHover,.dnaBadge,.showcaseBadge{position:absolute;z-index:5;padding:9px 11px;border-radius:11px;background:rgba(6,7,14,.84);border:1px solid rgba(118,89,255,.4);color:#dfe2ff;font-size:11px;font-family:monospace;backdrop-filter:blur(12px);display:flex;gap:8px;flex-wrap:wrap}.voxelInfo{bottom:12px;left:12px}.voxelInfo b{width:100%;color:#fff}.voxelInfo i{display:inline-block;width:9px;height:9px;border-radius:3px;vertical-align:-1px}.voxelHover{bottom:12px;left:12px;pointer-events:none}.dnaBadge{right:12px;bottom:12px;font-size:8px;letter-spacing:1px;color:#b5a8ff}.showcaseBadge{left:50%;top:12px;transform:translateX(-50%);font-size:8px;letter-spacing:1.4px;color:#e1dcff;border-color:rgba(154,124,255,.55);white-space:nowrap}.showcaseMode canvas{filter:saturate(1.12) contrast(1.05)}.compact .viewerTools{transform:scale(.86);transform-origin:top right}.compact .voxelInfo,.compact .voxelHover{font-size:9px;padding:6px 8px}@media(max-width:600px){.viewerTools{max-width:220px}.viewerTools button{font-size:10px;padding:7px 8px}.showcaseBadge{max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}.voxelInfo{max-width:calc(100% - 24px)}}
      `}</style>
    </div>
  );
}

function assetSignature(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

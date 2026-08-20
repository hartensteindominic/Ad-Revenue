import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class VoxelEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = { autoRotate: true, rotateSpeed: 1, backgroundColor: 0x0f172a, ...options };
    this.voxels = [];
    this.instanceToVoxel = new Map();
    this.meshesByColor = new Map();
    this.scene = null; this.camera = null; this.renderer = null; this.controls = null;
    this.raycaster = new THREE.Raycaster(); this.mouse = new THREE.Vector2(-99, -99);
    this.clock = new THREE.Clock(); this.rafId = null;
    this.hoveredVoxel = null; this.selectedVoxel = null;
    this.showEdges = true; this.showGrid = false; this.mode = 'view'; this.tool = 'select'; this.selectedColor = '#6366f1';
    this.history = []; this.historyIndex = -1; this.maxHistory = 50;
    this.edgeLines = null; this.gridHelper = null; this.floor = null; this.lights = {};
    this.glbModel = null; this.modelCenter = new THREE.Vector3(); this.dummy = new THREE.Object3D();
    this.explodeAmount = 0; this.targetExplodeAmount = 0;
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    this.scene.fog = new THREE.Fog(this.options.backgroundColor, 12, 35);
    const w = Math.max(1, this.canvas.clientWidth), h = Math.max(1, this.canvas.clientHeight);
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(8, 8, 8);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h, false); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    this.controls = new OrbitControls(this.camera, this.canvas); this.controls.enableDamping = true; this.controls.dampingFactor = 0.06;
    this.controls.autoRotate = this.options.autoRotate; this.controls.autoRotateSpeed = this.options.rotateSpeed;
    this.controls.minDistance = 2; this.controls.maxDistance = 40; this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.setupLighting(); this.setupFloor(); this.bindEvents(); this.animate();
  }

  setupLighting() {
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.35); this.scene.add(this.lights.ambient);
    this.lights.main = new THREE.DirectionalLight(0xffffff, 1.3); this.lights.main.position.set(8, 14, 6); this.lights.main.castShadow = true;
    this.lights.main.shadow.mapSize.set(1024, 1024); this.lights.main.shadow.camera.near = 1; this.lights.main.shadow.camera.far = 50;
    this.lights.main.shadow.camera.left = -12; this.lights.main.shadow.camera.right = 12; this.lights.main.shadow.camera.top = 12; this.lights.main.shadow.camera.bottom = -12;
    this.lights.main.shadow.bias = -0.0008; this.lights.main.shadow.normalBias = 0.02; this.scene.add(this.lights.main);
    this.lights.fill = new THREE.DirectionalLight(0x818cf8, 0.45); this.lights.fill.position.set(-6, 4, -8); this.scene.add(this.lights.fill);
    this.lights.rim = new THREE.DirectionalLight(0xc084fc, 0.75); this.lights.rim.position.set(-4, 6, -10); this.scene.add(this.lights.rim);
    this.lights.bounce = new THREE.PointLight(0x6366f1, 0.25, 15); this.lights.bounce.position.set(0, -1, 0); this.scene.add(this.lights.bounce);
  }

  setupFloor() {
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.25 }));
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = -0.5; this.floor.receiveShadow = true; this.scene.add(this.floor);
    this.gridHelper = new THREE.GridHelper(24, 24, 0x475569, 0x1e293b); this.gridHelper.position.y = -0.48;
    this.gridHelper.material.transparent = true; this.gridHelper.material.opacity = 0.25; this.gridHelper.visible = this.showGrid; this.scene.add(this.gridHelper);
  }

  loadVoxels(voxelData = []) {
    this.clearVoxels();
    this.voxels = voxelData.map((v, i) => ({ id: i, x: Number(v.x) || 0, y: Number(v.y) || 0, z: Number(v.z) || 0, color: v.color || '#6366f1', originalPosition: new THREE.Vector3(v.x, v.y, v.z), currentPosition: new THREE.Vector3(v.x, v.y, v.z), targetPosition: new THREE.Vector3(v.x, v.y, v.z), colorObj: new THREE.Color(v.color || '#6366f1') }));
    this.computeModelCenter(); this.buildInstancedMeshes(); this.history = []; this.historyIndex = -1; this.saveHistory();
  }

  computeModelCenter() {
    if (!this.voxels.length) return this.modelCenter.set(0, 0, 0);
    const box = new THREE.Box3(); this.voxels.forEach(v => box.expandByPoint(v.originalPosition)); box.getCenter(this.modelCenter);
  }

  buildInstancedMeshes() {
    this.meshesByColor.forEach(mesh => { this.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); });
    this.meshesByColor.clear(); this.instanceToVoxel.clear();
    const groups = new Map(); this.voxels.forEach(v => { if (!groups.has(v.color)) groups.set(v.color, []); groups.get(v.color).push(v); });
    groups.forEach((items, color) => {
      const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
      const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.25, metalness: 0.08, emissive: 0x000000, emissiveIntensity: 0 });
      const mesh = new THREE.InstancedMesh(geometry, material, items.length); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      items.forEach((voxel, i) => { this.dummy.position.copy(voxel.originalPosition); this.dummy.updateMatrix(); mesh.setMatrixAt(i, this.dummy.matrix); voxel.meshUuid = mesh.uuid; voxel.instanceId = i; this.instanceToVoxel.set(`${mesh.uuid}|${i}`, voxel); });
      mesh.instanceMatrix.needsUpdate = true; this.scene.add(mesh); this.meshesByColor.set(mesh.uuid, mesh);
    });
    this.buildEdgeLines(); this.frameCamera();
  }

  buildEdgeLines() {
    if (this.edgeLines) { this.scene.remove(this.edgeLines); this.edgeLines.geometry.dispose(); this.edgeLines.material.dispose(); this.edgeLines = null; }
    if (!this.showEdges || !this.voxels.length || this.voxels.length > 1500) return;
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.97, 0.97, 0.97)); const positions = [];
    this.voxels.forEach(v => { this.dummy.position.copy(v.currentPosition); this.dummy.updateMatrix(); for (let i = 0; i < edgeGeo.attributes.position.count; i++) { const p = new THREE.Vector3().fromBufferAttribute(edgeGeo.attributes.position, i).applyMatrix4(this.dummy.matrix); positions.push(p.x, p.y, p.z); } });
    const merged = new THREE.BufferGeometry(); merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.edgeLines = new THREE.LineSegments(merged, new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 })); this.scene.add(this.edgeLines); edgeGeo.dispose();
  }

  frameCamera() {
    if (!this.voxels.length) return;
    const box = new THREE.Box3(); this.voxels.forEach(v => box.expandByPoint(v.originalPosition)); const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1); const fov = this.camera.fov * Math.PI / 180; const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;
    this.camera.position.set(this.modelCenter.x + cameraZ * 0.7, this.modelCenter.y + cameraZ * 0.55, this.modelCenter.z + cameraZ * 0.7); this.controls.target.copy(this.modelCenter); this.controls.update();
  }
  resetCamera() { this.frameCamera(); }

  bindEvents() {
    this._onPointerMove = this.onPointerMove.bind(this); this._onPointerUp = this.onPointerUp.bind(this); this._onTouchStart = this.onTouchStart.bind(this); this._onTouchEnd = this.onTouchEnd.bind(this);
    this.canvas.addEventListener('pointermove', this._onPointerMove); this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false }); this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.resizeObserver = new ResizeObserver(() => this.onResize()); this.resizeObserver.observe(this.canvas);
  }
  onResize() { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false); }
  onPointerMove(e) { const r = this.canvas.getBoundingClientRect(); this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1; this.checkIntersection(); }
  onPointerUp() { if (this.hoveredVoxel) this.selectVoxel(this.hoveredVoxel); else this.deselectVoxel(); }
  onTouchStart(e) { if (e.touches.length === 1) this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() }; }
  onTouchEnd(e) { if (!this.touchStart) return; const t = e.changedTouches[0]; const dx = t.clientX - this.touchStart.x, dy = t.clientY - this.touchStart.y; if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - this.touchStart.time < 300) { const r = this.canvas.getBoundingClientRect(); this.mouse.x = ((t.clientX - r.left) / r.width) * 2 - 1; this.mouse.y = -((t.clientY - r.top) / r.height) * 2 + 1; this.checkIntersection(); if (this.hoveredVoxel) this.selectVoxel(this.hoveredVoxel); } this.touchStart = null; }

  checkIntersection() {
    this.raycaster.setFromCamera(this.mouse, this.camera); const hit = this.raycaster.intersectObjects([...this.meshesByColor.values()], false)[0];
    if (hit && hit.instanceId !== undefined) { const voxel = this.instanceToVoxel.get(`${hit.object.uuid}|${hit.instanceId}`); if (voxel && voxel !== this.hoveredVoxel) { this.unhoverVoxel(); this.hoveredVoxel = voxel; this.hoverVoxel(voxel); } }
    else if (this.hoveredVoxel) { this.unhoverVoxel(); this.hoveredVoxel = null; }
  }
  hoverVoxel(voxel) { const mesh = this.meshesByColor.get(voxel.meshUuid); if (mesh) { mesh.material.emissive.setHex(0xff0066); mesh.material.emissiveIntensity = 0.35; } this.canvas.style.cursor = 'pointer'; this.onHover?.(voxel); }
  unhoverVoxel() { if (!this.hoveredVoxel) return; const voxel = this.hoveredVoxel; if (this.selectedVoxel !== voxel) { const mesh = this.meshesByColor.get(voxel.meshUuid); if (mesh) { mesh.material.emissive.setHex(0x000000); mesh.material.emissiveIntensity = 0; } } this.canvas.style.cursor = 'default'; this.onHover?.(null); }
  selectVoxel(voxel) { if (this.selectedVoxel && this.selectedVoxel !== voxel) { const old = this.meshesByColor.get(this.selectedVoxel.meshUuid); if (old) { old.material.emissive.setHex(0x000000); old.material.emissiveIntensity = 0; } } this.selectedVoxel = voxel; const mesh = this.meshesByColor.get(voxel.meshUuid); if (mesh) { mesh.material.emissive.setHex(0xa855f7); mesh.material.emissiveIntensity = 0.45; } this.onSelect?.(voxel); if (this.mode === 'editor') this.applyEditorTool(voxel); }
  deselectVoxel() { if (!this.selectedVoxel) return; const mesh = this.meshesByColor.get(this.selectedVoxel.meshUuid); if (mesh) { mesh.material.emissive.setHex(0x000000); mesh.material.emissiveIntensity = 0; } this.selectedVoxel = null; this.onDeselect?.(); }

  applyEditorTool(voxel) { if (this.tool === 'paint') this.paintVoxel(voxel, this.selectedColor); if (this.tool === 'remove') this.removeVoxel(voxel); }
  addVoxelAtFace() { if (!this.hoveredVoxel) return; this.raycaster.setFromCamera(this.mouse, this.camera); const hit = this.raycaster.intersectObjects([...this.meshesByColor.values()], false)[0]; if (!hit || hit.instanceId === undefined || !hit.face) return; const base = this.instanceToVoxel.get(`${hit.object.uuid}|${hit.instanceId}`); if (!base) return; const n = hit.face.normal; const x = Math.round(base.x + n.x), y = Math.round(base.y + n.y), z = Math.round(base.z + n.z); if (this.voxels.some(v => v.x === x && v.y === y && v.z === z)) return; this.voxels.push({ id: this.voxels.length, x, y, z, color: this.selectedColor, originalPosition: new THREE.Vector3(x, y, z), currentPosition: new THREE.Vector3(x, y, z), targetPosition: new THREE.Vector3(x, y, z), colorObj: new THREE.Color(this.selectedColor) }); this.computeModelCenter(); this.buildInstancedMeshes(); this.saveHistory(); }
  paintVoxel(voxel, color) { if (!voxel || voxel.color === color) return; voxel.color = color; voxel.colorObj.set(color); this.buildInstancedMeshes(); this.saveHistory(); }
  removeVoxel(voxel) { this.voxels = this.voxels.filter(v => v !== voxel); this.computeModelCenter(); this.buildInstancedMeshes(); this.saveHistory(); this.deselectVoxel(); }
  setExplode(amount) { this.targetExplodeAmount = THREE.MathUtils.clamp(amount, 0, 1); }
  triggerAssemble() { this.targetExplodeAmount = this.targetExplodeAmount < 0.3 ? 1 : 0; if (this.targetExplodeAmount === 1) setTimeout(() => { this.targetExplodeAmount = 0; }, 500); }
  setShowEdges(show) { this.showEdges = !!show; this.buildEdgeLines(); }
  setShowGrid(show) { this.showGrid = !!show; if (this.gridHelper) this.gridHelper.visible = this.showGrid; if (this.floor) this.floor.visible = this.showGrid; }
  setAutoRotate(enabled, speed = this.options.rotateSpeed) { this.controls.autoRotate = !!enabled; this.controls.autoRotateSpeed = speed; }
  setShowcaseMode(active) { this.controls.autoRotate = !!active; this.controls.autoRotateSpeed = active ? 0.4 : this.options.rotateSpeed; this.lights.main.intensity = active ? 1.6 : 1.3; this.lights.rim.intensity = active ? 1.1 : 0.75; if (active) this.setShowGrid(false); }

  saveHistory() { const snapshot = JSON.stringify(this.voxels.map(v => ({ x: v.x, y: v.y, z: v.z, color: v.color }))); if (this.historyIndex < this.history.length - 1) this.history = this.history.slice(0, this.historyIndex + 1); this.history.push(snapshot); if (this.history.length > this.maxHistory) this.history.shift(); this.historyIndex = this.history.length - 1; }
  restoreHistory() { const snapshot = JSON.parse(this.history[this.historyIndex] || '[]'); this.voxels = snapshot.map((v, i) => ({ id: i, ...v, originalPosition: new THREE.Vector3(v.x, v.y, v.z), currentPosition: new THREE.Vector3(v.x, v.y, v.z), targetPosition: new THREE.Vector3(v.x, v.y, v.z), colorObj: new THREE.Color(v.color) })); this.computeModelCenter(); this.buildInstancedMeshes(); }
  undo() { if (this.historyIndex > 0) { this.historyIndex--; this.restoreHistory(); } }
  redo() { if (this.historyIndex < this.history.length - 1) { this.historyIndex++; this.restoreHistory(); } }
  exportJSON() { return JSON.stringify({ version: 1, voxels: this.voxels.map(v => ({ x: v.x, y: v.y, z: v.z, color: v.color })) }, null, 2); }
  importJSON(json) { try { const data = JSON.parse(json); if (Array.isArray(data.voxels)) { this.loadVoxels(data.voxels); return true; } } catch (e) { console.error('Voxel JSON import failed', e); } return false; }

  loadGLB(url, onLoad) { this.clearVoxels(); new GLTFLoader().load(url, gltf => { const model = gltf.scene; const box = new THREE.Box3().setFromObject(model); const center = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3()); const scale = 5 / Math.max(size.x, size.y, size.z, 0.001); model.position.sub(center).multiplyScalar(scale); model.scale.setScalar(scale); model.position.y += (size.y * scale) / 2; model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } }); this.scene.add(model); this.glbModel = model; this.controls.target.set(0, 0, 0); this.frameCamera(); onLoad?.(gltf); }, undefined, e => console.error('GLB load failed', e)); }
  clearVoxels() { if (this.glbModel) { this.scene.remove(this.glbModel); this.glbModel = null; } this.meshesByColor.forEach(mesh => { this.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }); this.meshesByColor.clear(); if (this.edgeLines) { this.scene.remove(this.edgeLines); this.edgeLines.geometry.dispose(); this.edgeLines.material.dispose(); this.edgeLines = null; } this.voxels = []; this.instanceToVoxel.clear(); this.selectedVoxel = null; this.hoveredVoxel = null; }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate()); const dt = Math.min(this.clock.getDelta(), 0.05);
    this.explodeAmount = THREE.MathUtils.damp(this.explodeAmount, this.targetExplodeAmount, 7, dt);
    if (this.voxels.length) this.meshesByColor.forEach(mesh => { this.voxels.filter(v => v.meshUuid === mesh.uuid).forEach(v => { const dir = v.originalPosition.clone().sub(this.modelCenter); v.currentPosition.copy(v.originalPosition); if (dir.lengthSq() > 0.0001) v.currentPosition.addScaledVector(dir.normalize(), this.explodeAmount * 1.8); this.dummy.position.copy(v.currentPosition); this.dummy.updateMatrix(); mesh.setMatrixAt(v.instanceId, this.dummy.matrix); }); mesh.instanceMatrix.needsUpdate = true; });
    this.controls.update(); this.renderer.render(this.scene, this.camera);
  }

  destroy() { cancelAnimationFrame(this.rafId); this.resizeObserver?.disconnect(); this.canvas.removeEventListener('pointermove', this._onPointerMove); this.canvas.removeEventListener('pointerup', this._onPointerUp); this.canvas.removeEventListener('touchstart', this._onTouchStart); this.canvas.removeEventListener('touchend', this._onTouchEnd); this.controls?.dispose(); this.clearVoxels(); this.floor?.geometry.dispose(); this.floor?.material.dispose(); this.gridHelper?.geometry.dispose(); this.gridHelper?.material.dispose(); this.renderer?.dispose(); }
}

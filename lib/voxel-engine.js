import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class VoxelEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = { autoRotate: true, rotateSpeed: 1, backgroundColor: 0x0f172a, ...options };
    this.voxels = [];
    this.meshesByColor = new Map();
    this.instanceToVoxel = new Map();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-99, -99);
    this.clock = new THREE.Clock();
    this.dummy = new THREE.Object3D();
    this.modelCenter = new THREE.Vector3();
    this.explodeAmount = 0;
    this.targetExplodeAmount = 0;
    this.showEdges = false;
    this.showGrid = true;
    this.mode = 'view';
    this.tool = 'select';
    this.selectedColor = '#6366f1';
    this.selectedVoxel = null;
    this.hoveredVoxel = null;
    this.edgeLines = null;
    this.gridHelper = null;
    this.floor = null;
    this.rafId = null;
    this.init();
  }

  init() {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    this.scene.fog = new THREE.Fog(this.options.backgroundColor, 12, 40);
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(8, 8, 8);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.autoRotate = this.options.autoRotate;
    this.controls.autoRotateSpeed = this.options.rotateSpeed;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.setupLighting();
    this.setupFloor();
    this.bindEvents();
    this.animate();
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const main = new THREE.DirectionalLight(0xffffff, 1.3);
    main.position.set(8, 14, 6);
    main.castShadow = true;
    main.shadow.mapSize.set(2048, 2048);
    main.shadow.camera.near = 1;
    main.shadow.camera.far = 50;
    main.shadow.camera.left = -12;
    main.shadow.camera.right = 12;
    main.shadow.camera.top = 12;
    main.shadow.camera.bottom = -12;
    main.shadow.bias = -0.0008;
    main.shadow.normalBias = 0.02;
    this.lights = {
      main,
      fill: new THREE.DirectionalLight(0x818cf8, 0.45),
      rim: new THREE.DirectionalLight(0xc084fc, 0.75),
      bounce: new THREE.PointLight(0x6366f1, 0.25, 15)
    };
    this.lights.fill.position.set(-6, 4, -8);
    this.lights.rim.position.set(-4, 6, -10);
    this.lights.bounce.position.set(0, -1, 0);
    Object.values(this.lights).forEach(light => this.scene.add(light));
  }

  setupFloor() {
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.25 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.5;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.gridHelper = new THREE.GridHelper(24, 24, 0x475569, 0x1e293b);
    this.gridHelper.position.y = -0.48;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.25;
    this.scene.add(this.gridHelper);
  }

  loadVoxels(voxelData = []) {
    this.clearVoxels();
    this.voxels = voxelData.map((v, id) => ({
      id, x: Number(v.x) || 0, y: Number(v.y) || 0, z: Number(v.z) || 0,
      color: v.color || '#6366f1',
      originalPosition: new THREE.Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0),
      currentPosition: new THREE.Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0),
      targetPosition: new THREE.Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0)
    }));
    this.computeModelCenter();
    this.buildInstancedMeshes();
    return this;
  }

  computeModelCenter() {
    const box = new THREE.Box3();
    this.voxels.forEach(v => box.expandByPoint(v.originalPosition));
    box.getCenter(this.modelCenter);
  }

  buildInstancedMeshes() {
    this.meshesByColor.forEach(mesh => this.scene.remove(mesh));
    this.meshesByColor.clear();
    this.instanceToVoxel.clear();
    if (!this.voxels.length) return;
    const groups = new Map();
    this.voxels.forEach(v => {
      if (!groups.has(v.color)) groups.set(v.color, []);
      groups.get(v.color).push(v);
    });
    const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    groups.forEach((items, color) => {
      const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.25, metalness: 0.08 });
      const mesh = new THREE.InstancedMesh(geometry, material, items.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      items.forEach((voxel, i) => {
        this.dummy.position.copy(voxel.originalPosition);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
        voxel.meshUuid = mesh.uuid;
        voxel.instanceId = i;
        this.instanceToVoxel.set(`${mesh.uuid}|${i}`, voxel);
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
      this.meshesByColor.set(mesh.uuid, mesh);
    });
    geometry.dispose();
    this.frameCamera();
    this.buildEdgeLines();
  }

  buildEdgeLines() {
    if (this.edgeLines) {
      this.scene.remove(this.edgeLines);
      this.edgeLines.geometry.dispose();
      this.edgeLines.material.dispose();
      this.edgeLines = null;
    }
    if (!this.showEdges || !this.voxels.length || this.voxels.length > 1500) return;
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.97, 0.97, 0.97));
    const positions = [];
    const p = edgeGeo.attributes.position;
    this.voxels.forEach(v => {
      this.dummy.position.copy(v.currentPosition);
      this.dummy.updateMatrix();
      for (let i = 0; i < p.count; i++) {
        const point = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(this.dummy.matrix);
        positions.push(point.x, point.y, point.z);
      }
    });
    edgeGeo.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.edgeLines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 }));
    this.scene.add(this.edgeLines);
  }

  frameCamera() {
    if (!this.voxels.length) return;
    const box = new THREE.Box3();
    this.voxels.forEach(v => box.expandByPoint(v.originalPosition));
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const distance = Math.abs(maxDim / (2 * Math.tan((this.camera.fov * Math.PI / 180) / 2))) * 2.2;
    this.camera.position.set(this.modelCenter.x + distance * 0.7, this.modelCenter.y + distance * 0.55, this.modelCenter.z + distance * 0.7);
    this.controls.target.copy(this.modelCenter);
    this.controls.update();
  }

  bindEvents() {
    this.onMove = event => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkIntersection();
    };
    this.onUp = () => this.hoveredVoxel ? this.selectVoxel(this.hoveredVoxel) : this.deselectVoxel();
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerup', this.onUp);
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.canvas);
  }

  onResize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  checkIntersection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObjects([...this.meshesByColor.values()])[0];
    if (!hit || hit.instanceId === undefined) {
      if (this.hoveredVoxel) this.unhoverVoxel();
      return;
    }
    const voxel = this.instanceToVoxel.get(`${hit.object.uuid}|${hit.instanceId}`);
    if (voxel && voxel !== this.hoveredVoxel) {
      this.unhoverVoxel();
      this.hoveredVoxel = voxel;
      this.hoverVoxel(voxel);
    }
  }

  hoverVoxel(voxel) {
    voxel.targetPosition.set(voxel.x, voxel.y + 0.12, voxel.z);
    const mesh = this.meshesByColor.get(voxel.meshUuid);
    if (mesh) { mesh.material.emissive.set(0xff0066); mesh.material.emissiveIntensity = 0.35; }
    this.canvas.style.cursor = 'pointer';
  }

  unhoverVoxel() {
    const voxel = this.hoveredVoxel;
    if (!voxel) return;
    voxel.targetPosition.copy(voxel.originalPosition);
    const mesh = this.meshesByColor.get(voxel.meshUuid);
    if (mesh && this.selectedVoxel !== voxel) { mesh.material.emissive.set(0x000000); mesh.material.emissiveIntensity = 0; }
    this.hoveredVoxel = null;
    this.canvas.style.cursor = 'default';
  }

  selectVoxel(voxel) {
    this.deselectVoxel();
    this.selectedVoxel = voxel;
    const mesh = this.meshesByColor.get(voxel.meshUuid);
    if (mesh) { mesh.material.emissive.set(0xa855f7); mesh.material.emissiveIntensity = 0.45; }
    this.onSelect?.(voxel);
    if (this.mode === 'editor') this.applyEditorTool(voxel);
  }

  deselectVoxel() {
    if (!this.selectedVoxel) return;
    const mesh = this.meshesByColor.get(this.selectedVoxel.meshUuid);
    if (mesh) { mesh.material.emissive.set(0x000000); mesh.material.emissiveIntensity = 0; }
    this.selectedVoxel = null;
    this.onDeselect?.();
  }

  applyEditorTool(voxel) {
    if (this.tool === 'paint') this.paintVoxel(voxel, this.selectedColor);
    if (this.tool === 'remove') this.removeVoxel(voxel);
  }

  addVoxelAtFace() {
    if (!this.hoveredVoxel) return false;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.intersectObjects([...this.meshesByColor.values()])[0];
    if (!hit || hit.instanceId === undefined) return false;
    const base = this.instanceToVoxel.get(`${hit.object.uuid}|${hit.instanceId}`);
    if (!base || !hit.face) return false;
    const normal = hit.face.normal.clone();
    const x = Math.round(base.x + normal.x), y = Math.round(base.y + normal.y), z = Math.round(base.z + normal.z);
    if (this.voxels.some(v => v.x === x && v.y === y && v.z === z)) return false;
    this.voxels.push({ id: this.voxels.length, x, y, z, color: this.selectedColor, originalPosition: new THREE.Vector3(x, y, z), currentPosition: new THREE.Vector3(x, y, z), targetPosition: new THREE.Vector3(x, y, z) });
    this.computeModelCenter();
    this.buildInstancedMeshes();
    return true;
  }

  paintVoxel(voxel, color) {
    if (!voxel || voxel.color === color) return;
    voxel.color = color;
    this.buildInstancedMeshes();
  }

  removeVoxel(voxel) {
    if (!voxel) return;
    this.voxels = this.voxels.filter(v => v !== voxel);
    this.selectedVoxel = null;
    this.computeModelCenter();
    this.buildInstancedMeshes();
  }

  setExplode(amount) { this.targetExplodeAmount = THREE.MathUtils.clamp(amount, 0, 1); }
  triggerAssemble() { this.targetExplodeAmount = this.targetExplodeAmount > 0.3 ? 0 : 1; }
  setShowEdges(show) { this.showEdges = !!show; this.buildEdgeLines(); }
  setShowGrid(show) { this.showGrid = !!show; if (this.gridHelper) this.gridHelper.visible = this.showGrid; if (this.floor) this.floor.visible = this.showGrid; }
  setShowcaseMode(active) { this.controls.autoRotate = !!active; this.controls.autoRotateSpeed = active ? 0.4 : this.options.rotateSpeed; this.setShowGrid(!active); this.lights.main.intensity = active ? 1.6 : 1.3; this.lights.rim.intensity = active ? 1.1 : 0.75; }

  exportJSON() {
    return JSON.stringify({ version: 1, voxels: this.voxels.map(v => ({ x: v.x, y: v.y, z: v.z, color: v.color })) }, null, 2);
  }

  importJSON(json) {
    try { const data = JSON.parse(json); if (!Array.isArray(data.voxels)) return false; this.loadVoxels(data.voxels); return true; }
    catch { return false; }
  }

  loadGLB(url, onLoad, onError) {
    const loader = new GLTFLoader();
    loader.load(url, gltf => {
      if (this.glbModel) this.scene.remove(this.glbModel);
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scale = 5 / maxDim;
      model.position.sub(center).multiplyScalar(scale);
      model.scale.setScalar(scale);
      model.position.y += (size.y * scale) / 2;
      model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      this.scene.add(model);
      this.glbModel = model;
      this.controls.target.set(0, 1, 0);
      onLoad?.(model, gltf);
    }, undefined, error => onError?.(error));
  }

  clearVoxels() {
    this.meshesByColor.forEach(mesh => this.scene.remove(mesh));
    this.meshesByColor.clear();
    this.instanceToVoxel.clear();
    this.voxels = [];
    this.selectedVoxel = null;
    this.hoveredVoxel = null;
    if (this.glbModel) { this.scene.remove(this.glbModel); this.glbModel = null; }
  }

  animate = () => {
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.explodeAmount = THREE.MathUtils.damp(this.explodeAmount, this.targetExplodeAmount, 5, dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp);
    this.controls.dispose();
    this.renderer.dispose();
    this.clearVoxels();
  }
}

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const PALETTES={
  car:['#7659ff','#b6a4ff','#38d5ff','#17182a','#f3f7ff'],
  villa:['#9d73ff','#d9caff','#48d8ff','#201a35','#f4f0ff'],
  owl:['#8b633f','#d8ad78','#f8edda','#302014','#73d7ff'],
  fox:['#d26c32','#f3a15f','#fff0d4','#4b2010','#5ed7ff'],
  robot:['#63d5ff','#d9f8ff','#697b9c','#1a2236','#9a78ff'],
  statue:['#d7d5ce','#f5f2e9','#8e8c85','#494844','#9c8cff'],
  ship:['#8eafc2','#d8f1ff','#566b7b','#202d38','#8c70ff'],
  tree:['#4fbd66','#a9ec9b','#70492e','#28371f','#b9f4ff']
};
const add=(out,x,y,z,c=0)=>out.push([x,y,z,c]);
function box(out,x1,x2,y1,y2,z1,z2,c=0){for(let x=x1;x<=x2;x++)for(let y=y1;y<=y2;y++)for(let z=z1;z<=z2;z++)add(out,x,y,z,c)}
function makeVoxels(shape){
  const v=[];
  if(shape==='car'){
    box(v,-8,8,0,2,-3,3,0);box(v,-7,7,3,3,-3,3,2);box(v,-5,5,4,5,-2,2,0);box(v,-3,3,5,5,-1,1,1);box(v,-7,7,1,1,-4,-4,3);box(v,-7,7,1,1,4,4,3);
    for(const x of[-6,6])for(const z of[-3,3])box(v,x,x,-2,0,z,z,3);for(const x of[-5,-4,4,5])for(const z of[-3,3])add(v,x,0,z,4);for(const x of[-3,-2,2,3])for(let z=-2;z<=2;z++)add(v,x,4,z,1);box(v,-1,1,2,2,-4,-4,4);
  }else if(shape==='villa'){
    box(v,-7,7,0,4,-5,5,0);box(v,-7,7,5,5,-5,5,1);box(v,-5,5,6,6,-4,4,0);box(v,-3,3,7,7,-3,3,0);for(const x of[-6,6])for(const z of[-4,4])box(v,x,x,1,3,z,z,2);box(v,-2,2,1,3,-6,-6,2);box(v,-1,1,1,2,6,6,2);for(const x of[-5,-4,4,5])for(const z of[-5,5])box(v,x,x,1,3,z,z,3);box(v,-7,-7,4,5,-1,1,3);box(v,7,7,4,5,-1,1,3);
  }else if(shape==='owl'||shape==='fox'){
    const fox=shape==='fox';for(let y=0;y<=6;y++){const r=(fox?10:11)-Math.max(0,y-2)*2;for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(x*x+z*z<=r)add(v,x,y,z,y>=5?1:0)}for(const x of[-3,3])box(v,x,x,5,8,-1,1,1);for(const x of[-2,2])box(v,x,x,-1,0,-1,1,0);add(v,-1,6,-4,2);add(v,1,6,-4,2);add(v,0,6,-4,3);if(fox){for(let y=1;y<=4;y++)add(v,4,y,0,0);for(let y=0;y<=2;y++)add(v,5,y,0,1);box(v,3,4,1,2,0,0,1)}
  }else if(shape==='robot'){
    box(v,-3,3,0,5,-3,3,0);box(v,-2,2,6,9,-2,2,1);box(v,-4,-4,1,5,-1,1,2);box(v,4,4,1,5,-1,1,2);box(v,-2,-2,-3,-1,-1,1,2);box(v,2,2,-3,-1,-1,1,2);add(v,-1,8,-3,3);add(v,1,8,-3,3);add(v,0,10,0,4);for(const x of[-3,3])for(const y of[2,4])add(v,x,y,-2,3);
  }else if(shape==='statue'){
    box(v,-4,4,0,1,-4,4,2);box(v,-3,3,2,3,-3,3,0);box(v,-2,2,4,8,-2,2,0);box(v,-3,3,9,10,-2,2,1);box(v,-3,-3,4,7,-1,1,2);box(v,3,3,4,7,-1,1,2);box(v,-1,1,11,12,-1,1,1);
  }else if(shape==='ship'){
    for(let y=0;y<=3;y++)for(let x=-8+y;x<=8-y;x++)for(let z=-3;z<=3;z++)add(v,x,y,z,y===3?1:0);box(v,-5,5,4,6,-2,2,0);box(v,-2,2,7,10,-1,1,3);box(v,-1,1,11,12,-1,1,4);box(v,-5,5,7,7,0,0,4);for(const x of[-6,6])box(v,x,x,1,2,-3,3,2);
  }else if(shape==='tree'){
    box(v,-1,1,0,6,-1,1,2);for(let y=5;y<=11;y++)for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(x*x+z*z<=17-(y-5)*2)add(v,x,y,z,y>8?1:0);box(v,-2,2,8,9,-2,2,1);
  }else box(v,-4,4,0,7,-4,4,0);
  return v;
}

export default function VoxelViewer({shape='car',compact=false,label=true,interactive=true,showcase=false}){
  const host=useRef(null),frame=useRef(0),autoRotateRef=useRef(!showcase),gridRef=useRef(false),explodeTargetRef=useRef(false),edgesRef=useRef(true);
  const [selected,setSelected]=useState(null),[hovered,setHovered]=useState(null),[explode,setExplode]=useState(false),[edges,setEdges]=useState(true),[autoRotate,setAutoRotate]=useState(!showcase),[grid,setGrid]=useState(false);
  useEffect(()=>{
    if(!host.current)return;const root=host.current;const scene=new THREE.Scene();scene.background=new THREE.Color('#070811');
    const camera=new THREE.PerspectiveCamera(32,1,.1,1000);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;root.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=8;controls.maxDistance=52;controls.enablePan=false;controls.autoRotate=autoRotateRef.current;controls.autoRotateSpeed=.6;
    scene.add(new THREE.HemisphereLight('#ddd8ff','#0b101a',2.2));const key=new THREE.DirectionalLight('#fff8ed',4);key.position.set(11,20,14);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);const rim=new THREE.PointLight('#7755ff',42,60);rim.position.set(-12,8,-10);scene.add(rim);const fill=new THREE.PointLight('#32d8ff',20,45);fill.position.set(10,5,-8);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(14,64),new THREE.MeshStandardMaterial({color:'#0a0d15',roughness:.78,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.4;floor.receiveShadow=true;scene.add(floor);
    const ring=new THREE.Mesh(new THREE.RingGeometry(5.8,5.86,96),new THREE.MeshBasicMaterial({color:'#7657ff',transparent:true,opacity:.34,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-2.38;scene.add(ring);
    const gridHelper=new THREE.GridHelper(24,24,'#25203d','#151725');gridHelper.position.y=-2.39;scene.add(gridHelper);
    const group=new THREE.Group();scene.add(group);const colors=PALETTES[shape]||PALETTES.car;const voxels=makeVoxels(shape);const geometry=new THREE.BoxGeometry(.72,.72,.72);const edgeGeometry=new THREE.EdgesGeometry(geometry);const buckets=new Map();voxels.forEach(v=>{if(!buckets.has(v[3]))buckets.set(v[3],[]);buckets.get(v[3]).push(v)});
    const meshes=[],edgeMeshes=[],materials=[];
    buckets.forEach((arr,c)=>{const material=new THREE.MeshStandardMaterial({color:colors[c],roughness:c===3?.32:.52,metalness:c===3?.18:.05,emissive:colors[c],emissiveIntensity:0});materials.push(material);const mesh=new THREE.InstancedMesh(geometry,material,arr.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.userData.voxels=arr;mesh.userData.basePositions=arr.map(v=>new THREE.Vector3(v[0]*.76,v[1]*.76-2.1,v[2]*.76));const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1);arr.forEach((v,i)=>{m.compose(mesh.userData.basePositions[i],q,s);mesh.setMatrixAt(i,m)});mesh.instanceMatrix.needsUpdate=true;group.add(mesh);meshes.push(mesh);
      const edgeMaterial=new THREE.LineBasicMaterial({color:'#b8a8ff',transparent:true,opacity:.18});const line=new THREE.LineSegments(edgeGeometry,edgeMaterial);line.userData.basePositions=mesh.userData.basePositions;line.userData.count=arr.length;line.userData.mesh=mesh;group.add(line);edgeMeshes.push(line);
    });
    const box3=new THREE.Box3();voxels.forEach(v=>box3.expandByPoint(new THREE.Vector3(v[0]*.76,v[1]*.76-2.1,v[2]*.76)));const size=box3.getSize(new THREE.Vector3()),center=box3.getCenter(new THREE.Vector3());const maxDim=Math.max(size.x,size.y,size.z);controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(maxDim*1.55,maxDim*1.05,maxDim*1.75));
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let lastHovered=null;
    const pointerAt=e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1};
    const resetMaterial=()=>materials.forEach(m=>{m.emissiveIntensity=0});
    const pick=e=>{if(!interactive)return;pointerAt(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];resetMaterial();if(!hit||hit.instanceId===undefined){lastHovered=null;setHovered(null);renderer.domElement.style.cursor='grab';return}const data=hit.object.userData.voxels[hit.instanceId];const item={x:data[0],y:data[1],z:data[2],color:colors[data[3]],instance:hit.instanceId};lastHovered=item;setHovered(item);hit.object.material.emissiveIntensity=.32;renderer.domElement.style.cursor='pointer'};
    const click=e=>{if(!interactive)return;pointerAt(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];if(!hit||hit.instanceId===undefined){setSelected(null);return}const data=hit.object.userData.voxels[hit.instanceId];setSelected({x:data[0],y:data[1],z:data[2],color:colors[data[3]],instance:hit.instanceId})};
    renderer.domElement.addEventListener('pointermove',pick);renderer.domElement.addEventListener('pointerleave',()=>{resetMaterial();lastHovered=null;setHovered(null)});renderer.domElement.addEventListener('click',click);
    const resize=()=>{const r=root.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(root);
    let explosionAmount=0;const animate=()=>{controls.autoRotate=autoRotateRef.current;gridHelper.visible=gridRef.current;edgeMeshes.forEach(x=>x.visible=edgesRef.current);const target=explodeTargetRef.current?1:0;explosionAmount=THREE.MathUtils.lerp(explosionAmount,target,.075);group.children.forEach(obj=>{if(!obj.userData.basePositions)return;const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1);obj.userData.basePositions.forEach((p,i)=>{const dir=p.clone().sub(center);if(dir.lengthSq()<.001)dir.set(0,1,0);dir.normalize();const pos=p.clone().addScaledVector(dir,1.8*explosionAmount);if(obj.isInstancedMesh){m.compose(pos,q,s);obj.setMatrixAt(i,m)}else{obj.position.copy(pos)}});if(obj.isInstancedMesh)obj.instanceMatrix.needsUpdate=true});controls.update();renderer.render(scene,camera);frame.current=requestAnimationFrame(animate)};animate();
    return()=>{ro.disconnect();cancelAnimationFrame(frame.current);controls.dispose();renderer.domElement.removeEventListener('pointermove',pick);renderer.domElement.removeEventListener('click',click);renderer.dispose();geometry.dispose();edgeGeometry.dispose();materials.forEach(m=>m.dispose());edgeMeshes.forEach(m=>m.material.dispose());floor.geometry.dispose();floor.material.dispose();ring.geometry.dispose();ring.material.dispose();gridHelper.geometry.dispose();gridHelper.material.dispose();root.removeChild(renderer.domElement)};
  },[shape,interactive]);
  const setRotation=()=>{const next=!autoRotate;autoRotateRef.current=next;setAutoRotate(next)};const setGridMode=()=>{const next=!grid;gridRef.current=next;setGrid(next)};const setExploded=()=>{const next=!explode;explodeTargetRef.current=next;setExplode(next)};const setEdgesMode=()=>{const next=!edges;edgesRef.current=next;setEdges(next)};
  return <div className={`voxelViewer ${compact?'compact':''}`} ref={host}>
    {label&&<div className="viewerBadge">REAL 3D VOXEL · DRAG · ZOOM · ROTATE</div>}
    {interactive&&<div className="viewerTools"><button type="button" onClick={setRotation}>{autoRotate?'⏸ Pause':'▶ Rotate'}</button><button type="button" onClick={setExploded}>{explode?'🧩 Assemble':'💥 Explode'}</button><button type="button" onClick={setGridMode}>▦ Grid</button><button type="button" onClick={setEdgesMode}>{edges?'◇ Edges':'◇ Clean'}</button></div>}
    {selected&&<div className="voxelInfo"><b>VOXEL SELECTED</b><span>X {selected.x} · Y {selected.y} · Z {selected.z}</span><span><i style={{background:selected.color}}/> {selected.color}</span></div>}
    {hovered&&!selected&&<div className="voxelHover">VOXEL {hovered.x},{hovered.y},{hovered.z}</div>}
    <style jsx>{`.viewerTools{position:absolute;top:12px;right:12px;z-index:5;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.viewerTools button{border:1px solid rgba(255,255,255,.12);background:rgba(8,8,17,.82);color:#fff;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(8px)}.viewerTools button:hover{border-color:#8066ff;background:rgba(118,89,255,.55)}.voxelInfo,.voxelHover{position:absolute;bottom:12px;left:12px;z-index:5;padding:9px 11px;border-radius:11px;background:rgba(8,8,17,.86);border:1px solid rgba(118,89,255,.4);color:#dfe2ff;font-size:11px;font-family:monospace;backdrop-filter:blur(10px);display:flex;gap:8px;flex-wrap:wrap}.voxelInfo b{width:100%;color:#fff}.voxelInfo i{display:inline-block;width:9px;height:9px;border-radius:3px;vertical-align:-1px}.voxelHover{border-color:rgba(118,89,255,.2);pointer-events:none}.compact .viewerTools{transform:scale(.86);transform-origin:top right}.compact .voxelInfo,.compact .voxelHover{font-size:9px;padding:6px 8px}@media(max-width:600px){.viewerTools{max-width:190px}.viewerTools button{font-size:10px;padding:7px}.voxelInfo{max-width:calc(100% - 24px)}}`}</style>
  </div>;
}

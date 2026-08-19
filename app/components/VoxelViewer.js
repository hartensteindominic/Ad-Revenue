'use client';

import { useEffect, useRef } from 'react';
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
    box(v,-8,8,0,2,-3,3,0); box(v,-7,7,3,3,-3,3,2);
    box(v,-5,5,4,5,-2,2,0); box(v,-3,3,5,5,-1,1,1);
    box(v,-7,7,1,1,-4,-4,3); box(v,-7,7,1,1,4,4,3);
    for(const x of[-6,6])for(const z of[-3,3])box(v,x,x,-2,0,z,z,3);
    for(const x of[-5,-4,4,5])for(const z of[-3,3])add(v,x,0,z,4);
    for(const x of[-3,-2,2,3])for(let z=-2;z<=2;z++)add(v,x,4,z,1);
    box(v,-1,1,2,2,-4,-4,4);
  } else if(shape==='villa'){
    box(v,-7,7,0,4,-5,5,0); box(v,-7,7,5,5,-5,5,1); box(v,-5,5,6,6,-4,4,0); box(v,-3,3,7,7,-3,3,0);
    for(const x of[-6,6])for(const z of[-4,4])box(v,x,x,1,3,z,z,2);
    box(v,-2,2,1,3,-6,-6,2); box(v,-1,1,1,2,6,6,2);
    for(const x of[-5,-4,4,5])for(const z of[-5,5])box(v,x,x,1,3,z,z,3);
    box(v,-7,-7,4,5,-1,1,3); box(v,7,7,4,5,-1,1,3);
  } else if(shape==='owl'||shape==='fox'){
    const fox=shape==='fox';
    for(let y=0;y<=6;y++){const r=(fox?10:11)-Math.max(0,y-2)*2;for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(x*x+z*z<=r)add(v,x,y,z,y>=5?1:0)}
    for(const x of[-3,3])box(v,x,x,5,8,-1,1,1);
    for(const x of[-2,2])box(v,x,x,-1,0,-1,1,0);
    add(v,-1,6,-4,2); add(v,1,6,-4,2); add(v,0,6,-4,3);
    if(fox){for(let y=1;y<=4;y++)add(v,4,y,0,0);for(let y=0;y<=2;y++)add(v,5,y,0,1);box(v,3,4,1,2,0,0,1)}
  } else if(shape==='robot'){
    box(v,-3,3,0,5,-3,3,0); box(v,-2,2,6,9,-2,2,1); box(v,-4,-4,1,5,-1,1,2);box(v,4,4,1,5,-1,1,2);
    box(v,-2,-2,-3,-1,-1,1,2);box(v,2,2,-3,-1,-1,1,2); add(v,-1,8,-3,3);add(v,1,8,-3,3);add(v,0,10,0,4);
    for(const x of[-3,3])for(const y of[2,4])add(v,x,y,-2,3);
  } else if(shape==='statue'){
    box(v,-4,4,0,1,-4,4,2); box(v,-3,3,2,3,-3,3,0); box(v,-2,2,4,8,-2,2,0); box(v,-3,3,9,10,-2,2,1);
    box(v,-3,-3,4,7,-1,1,2);box(v,3,3,4,7,-1,1,2);box(v,-1,1,11,12,-1,1,1);
  } else if(shape==='ship'){
    for(let y=0;y<=3;y++)for(let x=-8+y;x<=8-y;x++)for(let z=-3;z<=3;z++)add(v,x,y,z,y===3?1:0);
    box(v,-5,5,4,6,-2,2,0);box(v,-2,2,7,10,-1,1,3);box(v,-1,1,11,12,-1,1,4);box(v,-5,5,7,7,0,0,4);
    for(const x of[-6,6])box(v,x,x,1,2,-3,3,2);
  } else if(shape==='tree'){
    box(v,-1,1,0,6,-1,1,2);
    for(let y=5;y<=11;y++)for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)if(x*x+z*z<=17-(y-5)*2)add(v,x,y,z,y>8?1:0);
    box(v,-2,2,8,9,-2,2,1);
  } else box(v,-4,4,0,7,-4,4,0);
  return v;
}

export default function VoxelViewer({shape='car',compact=false,label=true}){
  const host=useRef(null); const frame=useRef(0);
  useEffect(()=>{
    if(!host.current)return;
    const root=host.current; const scene=new THREE.Scene(); scene.background=new THREE.Color('#070811');
    const camera=new THREE.PerspectiveCamera(32,1,.1,1000); camera.position.set(18,14,21);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12; root.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.065; controls.minDistance=10; controls.maxDistance=48; controls.target.set(0,3,0); controls.autoRotate=true; controls.autoRotateSpeed=.6; controls.enablePan=false;
    scene.add(new THREE.HemisphereLight('#ddd8ff','#0b101a',2.2));
    const key=new THREE.DirectionalLight('#fff8ed',4);key.position.set(11,20,14);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
    const rim=new THREE.PointLight('#7755ff',42,60);rim.position.set(-12,8,-10);scene.add(rim);const fill=new THREE.PointLight('#32d8ff',20,45);fill.position.set(10,5,-8);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(14,64),new THREE.MeshStandardMaterial({color:'#0a0d15',roughness:.78,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.4;floor.receiveShadow=true;scene.add(floor);
    const ring=new THREE.Mesh(new THREE.RingGeometry(5.8,5.86,96),new THREE.MeshBasicMaterial({color:'#7657ff',transparent:true,opacity:.34,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-2.38;scene.add(ring);
    const group=new THREE.Group();scene.add(group); const colors=PALETTES[shape]||PALETTES.car;const voxels=makeVoxels(shape);const geometry=new THREE.BoxGeometry(.72,.72,.72);
    const buckets=new Map();voxels.forEach(v=>{if(!buckets.has(v[3]))buckets.set(v[3],[]);buckets.get(v[3]).push(v)});
    buckets.forEach((arr,c)=>{const material=new THREE.MeshStandardMaterial({color:colors[c],roughness:c===3?.32:.52,metalness:c===3?.18:.05});const mesh=new THREE.InstancedMesh(geometry,material,arr.length);mesh.castShadow=true;mesh.receiveShadow=true;const q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1);arr.forEach((v,i)=>{const m=new THREE.Matrix4();m.compose(new THREE.Vector3(v[0]*.76,v[1]*.76-2.1,v[2]*.76),q,s);mesh.setMatrixAt(i,m)});mesh.instanceMatrix.needsUpdate=true;group.add(mesh)});
    const resize=()=>{const r=root.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(.1,r.width/Math.max(1,r.height));camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(root);
    const animate=()=>{controls.update();renderer.render(scene,camera);frame.current=requestAnimationFrame(animate)};animate();
    return()=>{ro.disconnect();cancelAnimationFrame(frame.current);controls.dispose();renderer.dispose();geometry.dispose();root.removeChild(renderer.domElement)};
  },[shape]);
  return <div className={`voxelViewer ${compact?'compact':''}`} ref={host}>{label&&<div className="viewerBadge">REAL 3D VOXEL · DRAG · ZOOM · ROTATE</div>}</div>;
}

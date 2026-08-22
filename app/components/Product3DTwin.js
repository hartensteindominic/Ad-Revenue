'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function mat(color, metal = 0.35, rough = 0.3) {
  return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
}
function add(g, geometry, material, p=[0,0,0], r=[0,0,0], s=[1,1,1]) {
  const m=new THREE.Mesh(geometry,material);
  m.position.set(...p); m.rotation.set(...r); m.scale.set(...s);
  m.castShadow=true; m.receiveShadow=true; g.add(m); return m;
}
function buildProduct(item={}) {
  const g=new THREE.Group();
  const name=`${item.name||''} ${item.type||''}`.toLowerCase();
  const main=mat(item.material==='gold'?0xd6a52d:item.material==='obsidian'?0x171a24:item.material==='ceramic'?0xe8e2d7:0x9aa4b5,.78,.2);
  const dark=mat(0x11131a,.72,.2), white=mat(0xf4f4f1,.05,.36), glass=mat(0x8edcff,.12,.08), accent=mat(0x7566ff,.55,.22);
  if(name.includes('headphone')) {
    add(g,new THREE.TorusGeometry(1.32,.12,18,72,Math.PI),main,[0,.45,0],[Math.PI/2,0,0]);
    for(const x of [-1.32,1.32]) { add(g,new THREE.CylinderGeometry(.5,.5,.3,40),dark,[x,.08,0],[Math.PI/2,0,0]); add(g,new THREE.TorusGeometry(.39,.075,14,36),accent,[x,.08,0],[Math.PI/2,0,0]); }
  } else if(name.includes('airpods')||name.includes('earbud')) {
    for(const x of [-.62,.62]) { add(g,new THREE.SphereGeometry(.47,28,20),white,[x,.28,0],[0,0,0],[1,.66,1]); add(g,new THREE.CapsuleGeometry(.105,.56,8,16),white,[x,-.12,.08]); }
    add(g,new THREE.BoxGeometry(1.65,.9,1.05),white,[0,-.68,0],[0,0,0],[1,.7,.9]);
  } else if(name.includes('shoe')||name.includes('air force')) {
    add(g,new THREE.SphereGeometry(1,32,22),white,[0,-.05,0],[0,0,0],[2.45,.62,1.08]); add(g,new THREE.BoxGeometry(2.75,.28,1.13),white,[0,-.5,0]);
    for(let i=0;i<6;i++) add(g,new THREE.CylinderGeometry(.025,.025,.7,10),dark,[-.72+i*.29,.18,-.53],[Math.PI/2,0,0]);
    add(g,new THREE.TorusGeometry(.32,.045,12,32),accent,[1.18,.15,.05],[Math.PI/2,0,0],[1.4,1,1]);
  } else if(name.includes('iphone')||name.includes('phone')) {
    add(g,new THREE.BoxGeometry(1.45,2.8,.18),main,[0,0,0],[0,.08,0]); add(g,new THREE.BoxGeometry(1.23,2.5,.04),glass,[0,0,.11]);
    for(const x of [-.42,-.08]) add(g,new THREE.CylinderGeometry(.16,.16,.04,24),dark,[x,1.05,.13],[Math.PI/2,0,0]);
    add(g,new THREE.BoxGeometry(.18,.5,.04),accent,[.38,-.88,.13]);
  } else if(name.includes('playstation')) {
    add(g,new THREE.BoxGeometry(.7,3.6,2.1),white,[0,0,0],[0,.05,0]); add(g,new THREE.BoxGeometry(.45,3.35,1.8),glass,[0,0,.08]); add(g,new THREE.BoxGeometry(.1,3.1,.08),accent,[0,0,1.0]);
  } else if(name.includes('gopro')||name.includes('camera')) {
    add(g,new THREE.BoxGeometry(1.8,1.5,.85),dark); add(g,new THREE.CylinderGeometry(.48,.48,.3,40),glass,[0,0,.52],[Math.PI/2,0,0]); add(g,new THREE.BoxGeometry(.5,.25,.04),main,[.55,.55,.44]);
  } else if(name.includes('watch')||name.includes('submariner')) {
    add(g,new THREE.CylinderGeometry(.78,.78,.22,56),main,[0,.2,0],[Math.PI/2,0,0]); add(g,new THREE.CylinderGeometry(.64,.64,.05,56),glass,[0,.2,.13],[Math.PI/2,0,0]);
    add(g,new THREE.BoxGeometry(.2,1.7,.08),dark,[0,-.9,0]); add(g,new THREE.BoxGeometry(.2,1.7,.08),dark,[0,1.3,0]); add(g,new THREE.TorusGeometry(.48,.025,8,48),accent,[0,.2,.17],[Math.PI/2,0,0]);
  } else if(name.includes('eyewear')||name.includes('wayfarer')) {
    for(const x of [-.62,.62]) add(g,new THREE.TorusGeometry(.45,.08,14,36),dark,[x,0,0],[Math.PI/2,0,0]); add(g,new THREE.BoxGeometry(1.15,.08,.08),dark); add(g,new THREE.BoxGeometry(.08,.08,.8),dark,[-1.05,0,0]); add(g,new THREE.BoxGeometry(.08,.08,.8),dark,[1.05,0,0]);
  } else {
    add(g,new THREE.CylinderGeometry(.78,.92,2.7,36),main); add(g,new THREE.TorusGeometry(.72,.06,12,44),dark,[0,1.15,0]); add(g,new THREE.CylinderGeometry(.5,.5,.08,36),dark,[0,1.4,0]);
  }
  return g;
}

export default function Product3DTwin({ item, hero=false }) {
  const host=useRef(null);
  useEffect(()=>{
    if(!host.current)return;
    const root=host.current; let renderer,scene,camera,controls,raf,ro;
    try {
      const lowPower=window.matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.hardwareConcurrency||4)<=4;
      scene=new THREE.Scene(); scene.background=new THREE.Color(0x05060c);
      camera=new THREE.PerspectiveCamera(30,1,.1,100); camera.position.set(0,.15,hero?7.2:6.1);
      renderer=new THREE.WebGLRenderer({antialias:!lowPower,alpha:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,hero?(lowPower?1.25:1.65):(lowPower?1.1:1.4)));
      renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
      renderer.shadowMap.enabled=!lowPower; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      root.replaceChildren(renderer.domElement); renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
      scene.add(new THREE.HemisphereLight(0xeaf2ff,0x10121c,1.9));
      const key=new THREE.DirectionalLight(0xffffff,2.8); key.position.set(4,6,5); key.castShadow=true; scene.add(key);
      const rim=new THREE.DirectionalLight(0x806dff,1.7); rim.position.set(-4,2,-4); scene.add(rim);
      const fill=new THREE.PointLight(0x3d8cff,1.2,12); fill.position.set(2,-.5,4); scene.add(fill);
      const floor=new THREE.Mesh(new THREE.CircleGeometry(3.4,64),new THREE.MeshStandardMaterial({color:0x0d1020,roughness:.78,metalness:.15})); floor.rotation.x=-Math.PI/2; floor.position.y=-1.72; floor.receiveShadow=true; scene.add(floor);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.55,.012,8,96),new THREE.MeshBasicMaterial({color:0x6f5cff,transparent:true,opacity:.28})); ring.rotation.x=-Math.PI/2; ring.position.y=-1.69; scene.add(ring);
      const object=buildProduct(item); scene.add(object);
      const box=new THREE.Box3().setFromObject(object), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3()); object.position.sub(center); object.position.y+=.12;
      const maxDim=Math.max(size.x,size.y,size.z,1); camera.position.z=Math.max(hero?6.5:5.3,maxDim*2.55);
      controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.enablePan=false; controls.minDistance=Math.max(3,maxDim*1.4); controls.maxDistance=Math.max(9,maxDim*4.2); controls.autoRotate=!lowPower; controls.autoRotateSpeed=.7; controls.target.set(0,.05,0);
      const resize=()=>{const w=Math.max(root.clientWidth,1),h=Math.max(root.clientHeight,hero?390:285); camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false)};
      resize(); ro=new ResizeObserver(resize); ro.observe(root);
      const animate=()=>{raf=requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera)}; animate();
      return()=>{cancelAnimationFrame(raf); ro?.disconnect(); controls?.dispose(); renderer?.dispose(); scene?.traverse(o=>{o.geometry?.dispose?.(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose()); else o.material?.dispose?.()})};
    } catch { root.innerHTML='<div style="height:100%;display:grid;place-items:center;color:#a78bff;font-size:11px;font-weight:900;letter-spacing:.16em">3D TWIN READY</div>'; return undefined; }
  },[item,hero]);
  return <div ref={host} aria-label={`${item?.name||'Real-world object'} 3D NFT digital twin`} style={{width:'100%',height:'100%',minHeight:hero?390:285}}/>;
}

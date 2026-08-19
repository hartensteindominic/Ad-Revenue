'use client';

import { useEffect, useRef } from 'react';

const SHAPES = {
  car: { body:'#8b6cff', trim:'#43c8ff', dark:'#252039', accent:'#d7ceff' },
  villa: { body:'#b48cff', trim:'#59d8ff', dark:'#302447', accent:'#eee8ff' },
  owl: { body:'#9b704d', trim:'#e6c18d', dark:'#3a281b', accent:'#fff4dd' },
  robot: { body:'#6fd9ff', trim:'#d9f8ff', dark:'#29344d', accent:'#9c7cff' },
  statue: { body:'#d7d5cc', trim:'#f7f4ea', dark:'#5a5953', accent:'#a69fff' },
  ship: { body:'#9bb8c8', trim:'#dff6ff', dark:'#263744', accent:'#8f70ff' },
  tree: { body:'#55c66d', trim:'#b5f1a7', dark:'#65452d', accent:'#8df0b2' },
  fox: { body:'#d87938', trim:'#f5b16e', dark:'#542513', accent:'#fff0d4' },
};

function makeVoxels(shape){
  const out=[]; const add=(x,y,z,c=0)=>out.push([x,y,z,c]);
  if(shape==='car'){
    for(let x=-7;x<=7;x++) for(let y=0;y<=2;y++) for(let z=-3;z<=3;z++) add(x,y,z,y===2?1:0);
    for(let x=-4;x<=4;x++) for(let y=3;y<=5;y++) for(let z=-2;z<=2;z++) if(Math.abs(x)<=4-(y-3)) add(x,y,z,0);
    for(const x of[-5,5]) for(const z of[-3,3]) for(let y=-2;y<=0;y++) add(x,y,z,2);
    for(let x=-3;x<=3;x++) add(x,5,0,3);
    for(let x=-5;x<=5;x++) for(let z of[-3,3]) add(x,1,z,1);
  } else if(shape==='villa'){
    for(let x=-6;x<=6;x++) for(let y=0;y<=4;y++) for(let z=-5;z<=5;z++) add(x,y,z,y===0?2:0);
    for(let x=-6;x<=6;x++) for(let z=-5;z<=5;z++) add(x,5,z,1);
    for(let x=-5;x<=5;x++) for(let z=-4;z<=4;z++) add(x,6,z,0);
    for(let x=-4;x<=4;x++) for(let z=-3;z<=3;z++) add(x,7,z,0);
    for(let y=1;y<=3;y++) for(const x of[-6,6]) for(const z of[-5,5]) add(x,y,z,2);
    for(let y=1;y<=2;y++) for(const x of[-2,2]) for(let z=-5;z<=-3;z++) add(x,y,z,3);
  } else if(shape==='owl'||shape==='fox'){
    const fox=shape==='fox';
    for(let y=0;y<=6;y++) for(let x=-3;x<=3;x++) for(let z=-3;z<=3;z++){
      const r=(fox?10:9)-Math.max(0,y-3)*2;
      if(x*x+z*z<=r) add(x,y,z,y>=5?1:0);
    }
    for(const x of[-3,3]) for(let y=5;y<=8;y++) for(let z=-1;z<=1;z++) add(x,y,z,1);
    for(const x of[-1,1]) add(x,6,-3,3);
    for(const x of[-2,2]) for(let y=-1;y<=0;y++) add(x,y,0,0);
    if(fox){ for(let y=1;y<=4;y++) add(4,y,0,0); for(let y=0;y<=2;y++) add(5,y,0,1); }
  } else if(shape==='robot'){
    for(let x=-3;x<=3;x++) for(let y=0;y<=5;y++) for(let z=-3;z<=3;z++) add(x,y,z,y===5?1:0);
    for(let x=-2;x<=2;x++) for(let y=6;y<=9;y++) for(let z=-2;z<=2;z++) add(x,y,z,1);
    for(const x of[-4,4]) for(let y=1;y<=5;y++) for(let z=-1;z<=1;z++) add(x,y,z,2);
    for(const x of[-2,2]) for(let y=-3;y<0;y++) for(let z=-1;z<=1;z++) add(x,y,z,2);
    for(const x of[-1,1]) add(x,8,-3,3);
    add(0,10,0,3);
  } else if(shape==='statue'){
    for(let x=-4;x<=4;x++) for(let z=-4;z<=4;z++) add(x,0,z,2);
    for(let x=-3;x<=3;x++) for(let y=1;y<=3;y++) for(let z=-3;z<=3;z++) add(x,y,z,0);
    for(let y=4;y<=8;y++) for(let x=-2;x<=2;x++) for(let z=-2;z<=2;z++) add(x,y,z,0);
    for(let x=-3;x<=3;x++) for(let y=9;y<=10;y++) for(let z=-2;z<=2;z++) add(x,y,z,1);
  } else if(shape==='ship'){
    for(let x=-8;x<=8;x++) for(let y=0;y<=3;y++) for(let z=-3;z<=3;z++) if(Math.abs(x)<=8-y) add(x,y,z,y===3?1:0);
    for(let x=-4;x<=4;x++) for(let y=4;y<=6;y++) for(let z=-2;z<=2;z++) add(x,y,z,0);
    for(let y=7;y<=11;y++) add(0,y,0,3);
    for(let x=-3;x<=3;x++) add(x,9,0,3);
  } else if(shape==='tree'){
    for(let y=0;y<=6;y++) for(let x=-1;x<=1;x++) for(let z=-1;z<=1;z++) add(x,y,z,2);
    for(let y=5;y<=11;y++) for(let x=-4;x<=4;x++) for(let z=-4;z<=4;z++) if(x*x+z*z<=(15-(y-5)*2)) add(x,y,z,y>8?1:0);
  } else {
    for(let x=-4;x<=4;x++) for(let y=0;y<=7;y++) for(let z=-4;z<=4;z++) add(x,y,z,0);
  }
  return out;
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector(`script[src="${src}"]`); if(existing){existing.addEventListener('load',resolve,{once:true}); if(window.THREE) resolve(); return;}
    const s=document.createElement('script'); s.src=src; s.async=true; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
  });
}

export default function VoxelViewer({ shape='car', compact=false, label=true }){
  const host=useRef(null); const frame=useRef(null);
  useEffect(()=>{
    let dead=false; let renderer; let scene; let camera; let controls; let group;
    const boot=async()=>{
      try{
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/js/controls/OrbitControls.js');
        if(dead||!host.current||!window.THREE) return;
        const T=window.THREE; scene=new T.Scene(); scene.background=new T.Color('#070811');
        camera=new T.PerspectiveCamera(32,1,.1,1000); camera.position.set(18,15,22);
        renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15; host.current.appendChild(renderer.domElement);
        controls=new T.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.07; controls.minDistance=11; controls.maxDistance=48; controls.target.set(0,3,0); controls.autoRotate=true; controls.autoRotateSpeed=.55;
        scene.add(new T.HemisphereLight('#dcd6ff','#10131d',2.2)); const key=new T.DirectionalLight('#ffffff',3.5); key.position.set(10,22,14); key.castShadow=true; scene.add(key); const rim=new T.PointLight('#7b5cff',35,55); rim.position.set(-10,8,-10); scene.add(rim); const cyan=new T.PointLight('#38d9ff',18,40); cyan.position.set(8,4,-8); scene.add(cyan);
        const floor=new T.Mesh(new T.CircleGeometry(13,64),new T.MeshStandardMaterial({color:'#0b0d16',metalness:.2,roughness:.7})); floor.rotation.x=-Math.PI/2; floor.position.y=-2.4; floor.receiveShadow=true; scene.add(floor);
        const ring=new T.Mesh(new T.RingGeometry(5.7,5.76,96),new T.MeshBasicMaterial({color:'#7657ff',transparent:true,opacity:.32,side:T.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-2.38; scene.add(ring);
        group=new T.Group(); scene.add(group); const colors=SHAPES[shape]||SHAPES.car; const vox=makeVoxels(shape); const geo=new T.BoxGeometry(.72,.72,.72); const mats=[colors.body,colors.trim,colors.dark,colors.accent].map(c=>new T.MeshStandardMaterial({color:c,roughness:.5,metalness:.08}));
        const by=new Map(); vox.forEach(v=>{const c=v[3]; if(!by.has(c)) by.set(c,[]); by.get(c).push(v);});
        by.forEach((arr,c)=>{const mesh=new T.InstancedMesh(geo,mats[c%4],arr.length); mesh.castShadow=true; mesh.receiveShadow=true; const q=new T.Quaternion(); const s=new T.Vector3(1,1,1); arr.forEach((v,i)=>{const m=new T.Matrix4(); m.compose(new T.Vector3(v[0]*.76,v[1]*.76-2.1,v[2]*.76),q,s); mesh.setMatrixAt(i,m);}); mesh.instanceMatrix.needsUpdate=true; group.add(mesh);});
        const edgeGeo=new T.EdgesGeometry(geo); const edgeMat=new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.13}); const outline=new T.InstancedMesh(geo,mats[0],0); void outline; // keeps the viewer lightweight while individual blocks remain physically separated
        const resize=()=>{if(!host.current||!renderer) return; const r=host.current.getBoundingClientRect(); renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false); camera.aspect=Math.max(.1,r.width/Math.max(1,r.height)); camera.updateProjectionMatrix();};
        resize(); const ro=new ResizeObserver(resize); ro.observe(host.current); const animate=()=>{if(dead)return; controls.update(); renderer.render(scene,camera); frame.current=requestAnimationFrame(animate)}; animate();
        return()=>{ro.disconnect(); cancelAnimationFrame(frame.current); renderer.dispose(); geo.dispose(); mats.forEach(m=>m.dispose()); renderer.domElement.remove();};
      }catch(e){console.error('Voxel viewer failed',e)}
    };
    let cleanup; boot().then(c=>cleanup=c); return()=>{dead=true; if(cleanup)cleanup(); cancelAnimationFrame(frame.current);};
  },[shape]);
  return <div className={`voxelViewer ${compact?'compact':''}`} ref={host}>{label&&<div className="viewerBadge">REAL 3D VOXEL · DRAG TO ROTATE</div>}</div>;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const M=(color,metalness=.2,roughness=.3,clearcoat=0)=>new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat,clearcoatRoughness:.18});
const add=(g,geometry,material,p=[0,0,0],r=[0,0,0],s=[1,1,1])=>{const m=new THREE.Mesh(geometry,material);m.position.set(...p);m.rotation.set(...r);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
const bevel=(g,size,mat,p=[0,0,0],r=[0,0,0],radius=.08)=>add(g,new RoundedBoxGeometry(size[0],size[1],size[2],6,radius),mat,p,r);

function buildProduct(item={}){
 const g=new THREE.Group(),n=`${item.name||''} ${item.type||''}`.toLowerCase();
 const metallic=M(0x9ca7b7,.86,.2,.35),black=M(0x11151d,.72,.2,.35),white=M(0xf3f1ea,.04,.25,.3),rubber=M(0x252a31,.05,.62,.1),glass=M(0x4c87ad,.28,.07,.65),chrome=M(0xcbd3dc,.92,.12,.55),blue=M(0x5268ff,.45,.2,.35),gold=M(0xd2a53a,.88,.17,.45),leather=M(0x38281f,.05,.55,.1),steel=M(0x8f98a5,.9,.16,.38),stanleyGreen=M(0x0b5d55,.35,.22,.42);
 if(n.includes('quencher')||n.includes('stanley')||n.includes('tumbler')){
   const body=add(g,new THREE.CylinderGeometry(.78,.72,2.55,72),stanleyGreen,[0,.05,0]);
   add(g,new THREE.TorusGeometry(.75,.035,16,72),steel,[0,1.31,0]);
   add(g,new THREE.CylinderGeometry(.77,.77,.12,72),black,[0,1.37,0]);
   add(g,new THREE.CylinderGeometry(.62,.62,.08,72),stanleyGreen,[0,1.46,0]);
   add(g,new THREE.CylinderGeometry(.07,.07,.88,24),clearMaterial(),[.22,1.88,.08]);
   const handle=new THREE.TorusGeometry(.55,.11,20,64,Math.PI*1.25);add(g,handle,stanleyGreen,[.77,.15,0],[Math.PI/2,0,Math.PI/2]);
   body.scale.x=1.02;
 }
 else if(n.includes('headphone')){add(g,new THREE.TorusGeometry(1.38,.105,24,96,Math.PI),chrome,[0,.5,0],[Math.PI/2,0,0]);for(const x of[-1.36,1.36]){bevel(g,[.58,.68,.38],black,[x,.03,0],[0,0,0],.16);add(g,new THREE.TorusGeometry(.39,.065,20,56),blue,[x,.03,.22],[Math.PI/2,0,0]);add(g,new THREE.CylinderGeometry(.3,.3,.055,48),rubber,[x,.03,.25],[Math.PI/2,0,0])}}
 else if(n.includes('airpods')||n.includes('earbud')){for(const x of[-.58,.58]){add(g,new THREE.SphereGeometry(.46,40,28),white,[x,.28,0],[0,0,0],[1,.68,1]);add(g,new THREE.CapsuleGeometry(.095,.62,12,20),white,[x,-.13,.08]);add(g,new THREE.SphereGeometry(.055,18,12),black,[x,-.45,.08])}bevel(g,[1.7,.9,1.08],white,[0,-.72,0],[0,0,0],.2);bevel(g,[1.34,.06,.82],glass,[0,-.3,.55],[0,0,0],.02)}
 else if(n.includes('shoe')||n.includes('air force')){bevel(g,[2.75,.58,1.08],white,[0,-.1,0],[0,.02,0],.28);bevel(g,[2.85,.22,1.13],white,[.04,-.48,0],[-.02,0,0],.09);bevel(g,[2.42,.07,1.03],rubber,[.16,-.62,0],[0,0,0],.03);for(let i=0;i<7;i++)add(g,new THREE.CylinderGeometry(.025,.025,.62,12),black,[-.82+i*.27,.13,-.54],[Math.PI/2,0,0]);add(g,new THREE.TorusGeometry(.29,.045,14,40),blue,[1.18,.14,.05],[Math.PI/2,0,0],[1.4,1,1])}
 else if(n.includes('iphone')||n.includes('phone')){bevel(g,[1.5,2.86,.2],metallic,[0,0,0],[0,.05,0],.14);bevel(g,[1.27,2.58,.035],glass,[0,0,.125],[0,.05,0],.04);bevel(g,[.45,.48,.035],black,[.36,.91,.145],[0,.05,0],.08);for(const x of[.22,.52])add(g,new THREE.CylinderGeometry(.115,.115,.045,32),black,[x,.99,.16],[Math.PI/2,0,0])}
 else if(n.includes('playstation')){bevel(g,[.78,3.65,2.1],white,[0,0,0],[0,.04,0],.2);bevel(g,[.46,3.35,1.78],glass,[0,0,.12],[0,.04,0],.12);add(g,new THREE.BoxGeometry(.1,3.05,.07),blue,[0,0,1.04]);add(g,new THREE.CylinderGeometry(.16,.16,.06,36),black,[.24,-1.34,1.05],[Math.PI/2,0,0])}
 else if(n.includes('gopro')||n.includes('camera')){bevel(g,[1.9,1.48,.9],black,[0,0,0],[0,0,0],.15);bevel(g,[.48,.3,.08],metallic,[.5,.54,.48],[0,0,0],.05);add(g,new THREE.CylinderGeometry(.49,.49,.28,56),glass,[0,0,.54],[Math.PI/2,0,0]);add(g,new THREE.TorusGeometry(.34,.045,14,48),chrome,[0,0,.71],[Math.PI/2,0,0])}
 else if(n.includes('watch')||n.includes('submariner')){add(g,new THREE.CylinderGeometry(.82,.82,.25,72),gold,[0,.2,0],[Math.PI/2,0,0]);add(g,new THREE.CylinderGeometry(.68,.68,.055,72),glass,[0,.2,.145],[Math.PI/2,0,0]);add(g,new THREE.TorusGeometry(.6,.075,18,72),black,[0,.2,.18],[Math.PI/2,0,0]);add(g,new THREE.TorusGeometry(.51,.025,10,64),blue,[0,.2,.19],[Math.PI/2,0,0]);bevel(g,[.28,1.65,.1],leather,[0,-.82,0],[0,0,0],.04);bevel(g,[.28,1.65,.1],leather,[0,1.22,0],[0,0,0],.04)}
 else if(n.includes('wayfarer')||n.includes('eyewear')){for(const x of[-.63,.63]){add(g,new THREE.TorusGeometry(.46,.075,20,56),black,[x,0,0],[Math.PI/2,0,0]);add(g,new THREE.CircleGeometry(.39,48),glass,[x,0,.01],[Math.PI/2,0,0])}bevel(g,[1.12,.09,.1],black,[0,0,0],[0,0,0],.03);add(g,new THREE.BoxGeometry(.08,.08,.85),black,[-1.08,0,0],[0,0,.12]);add(g,new THREE.BoxGeometry(.08,.08,.85),black,[1.08,0,0],[0,0,-.12])}
 else {const body=item.material==='gold'?gold:item.material==='obsidian'?black:item.material==='ceramic'?white:metallic;add(g,new THREE.CylinderGeometry(.78,.9,2.7,64),body);add(g,new THREE.TorusGeometry(.72,.065,18,64),chrome,[0,1.18,0]);add(g,new THREE.CylinderGeometry(.52,.52,.09,48),black,[0,1.42,0]);add(g,new THREE.TorusGeometry(.35,.04,12,48),blue,[0,1.46,0]);bevel(g,[.17,.65,.17],body,[.45,.92,0],[0,0,-.3],.05)}
 return g;
}

function clearMaterial(){return new THREE.MeshPhysicalMaterial({color:0x86e5dd,transmission:.72,transparent:true,opacity:.7,roughness:.04,metalness:.02,ior:1.45})}

function TwinFallback({item,hidden}){return <div className="vv3-twinFallback" role="img" aria-label={`${item?.name||'Real-world object'} realistic 3D NFT digital twin`} aria-hidden={hidden?'true':undefined} style={{opacity:hidden?0:1,pointerEvents:hidden?'none':'auto'}}><div className="vv3-twinFallbackOrb"/><span>REALISTIC 3D TWIN</span><small>Interactive digital collectible</small></div>}

function StudioStage(){
 const g=new THREE.Group();
 const floor=new THREE.Mesh(new THREE.CircleGeometry(3.8,96),new THREE.MeshStandardMaterial({color:0x0b0e16,roughness:.5,metalness:.15}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-1.42;floor.receiveShadow=true;g.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.65,.012,8,96),new THREE.MeshBasicMaterial({color:0x6658e8,transparent:true,opacity:.45}));
 ring.rotation.x=Math.PI/2;ring.position.y=-1.405;g.add(ring);
 return g;
}

export default function Product3DTwin({item,hero=false}){
 const host=useRef(null),[active,setActive]=useState(hero),[ready,setReady]=useState(false);
 useEffect(()=>{const root=host.current;if(!root||hero)return;const io=new IntersectionObserver(([e])=>setActive(e.isIntersecting),{rootMargin:'300px'});io.observe(root);return()=>io.disconnect()},[hero]);
 useEffect(()=>{const root=host.current;if(!root||!active)return;let mounted=true,renderer,scene,camera,controls,raf,ro,object;const fallback=()=>{if(mounted)setReady(false)};try{const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x070910,.055);camera=new THREE.PerspectiveCamera(30,1,.1,100);renderer=new THREE.WebGLRenderer({antialias:!reduced,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,hero?1.8:1.45));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=!reduced;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',fallback,{passive:true});root.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xf7fbff,0x080b13,2.1));const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(4,7,6);key.castShadow=true;key.shadow.mapSize.set(hero?1536:1024,hero?1536:1024);key.shadow.camera.near=.1;key.shadow.camera.far=20;scene.add(key);const rim=new THREE.DirectionalLight(0x7667ff,2.8);rim.position.set(-5,3,-5);scene.add(rim);const fill=new THREE.PointLight(0x35c8ff,1.2,8);fill.position.set(3,-.2,-2);scene.add(fill);scene.add(StudioStage());object=buildProduct(item);scene.add(object);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());object.position.sub(center);object.position.y+=.18;const max=Math.max(size.x,size.y,size.z,1);camera.position.set(max*.72,.18,Math.max(hero?6.2:5.2,max*2.65));controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=Math.max(3,max*1.25);controls.maxDistance=Math.max(10,max*4.2);controls.autoRotate=!reduced;controls.autoRotateSpeed=.38;controls.target.set(0,.08,0);const resize=()=>{if(!mounted)return;const w=Math.max(root.clientWidth,1),h=Math.max(root.clientHeight,hero?390:300);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};resize();ro=new ResizeObserver(resize);ro.observe(root);const animate=()=>{if(!mounted)return;raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)};animate();setReady(true)}catch{fallback()}return()=>{mounted=false;if(raf)cancelAnimationFrame(raf);ro?.disconnect();controls?.dispose();renderer?.domElement?.removeEventListener('webglcontextlost',fallback);scene?.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose?.()});renderer?.dispose();if(renderer?.domElement?.parentNode===root)root.removeChild(renderer.domElement)}},[item,hero,active]);
 return <div ref={host} className="vv3-twinCanvas" style={{width:'100%',height:'100%',minHeight:hero?390:300,position:'relative',overflow:'hidden',borderRadius:'inherit'}}>
   <TwinFallback item={item} hidden={ready}/>
   {item?.modelSourceUrl&&<a className="vv3-exactModelLink" href={item.modelSourceUrl} target="_blank" rel="noreferrer" aria-label={`Inspect the published model source for ${item.name||'this product'}`}>Inspect published model ↗</a>}
 </div>;
}

'use client';
import {useEffect,useRef,useState} from 'react';
export default function RealWorld3DPreview({item}) {
 const ref=useRef(null); const [visible,setVisible]=useState(false);
 useEffect(()=>{const n=ref.current;if(!n)return;const o=new IntersectionObserver(([e])=>setVisible(Boolean(e&&e.isIntersecting)),{rootMargin:'500px'});o.observe(n);return()=>o.disconnect()},[]);
 return <div ref={ref} className="rw3d">{visible&&item&&item.modelEmbedUrl?<iframe title={item.name+' 3D model'} src={item.modelEmbedUrl} loading="lazy" allowFullScreen/>:<div className="placeholder"><b>3D</b><span>Real-world model</span></div>}<style jsx>{`.rw3d{height:100%;min-height:240px;background:#070910;overflow:hidden}.rw3d iframe{width:100%;height:100%;min-height:240px;border:0;display:block}.placeholder{height:100%;min-height:240px;display:grid;place-content:center;text-align:center;background:#070910;color:#cfd4df}.placeholder b{font-size:32px}.placeholder span{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#7f899d}`}</style></div>
}

'use client';
import {useState} from 'react';
export default function ResilientObjectMedia({src,alt='',fallback,children}){const[failed,setFailed]=useState(false);return <div className="media">{!failed&&src?<img src={src} alt={alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:fallback}{children}<style jsx>{`.media{width:100%;height:100%;position:relative;overflow:hidden}.media img{width:100%;height:100%;display:block;object-fit:cover}`}</style></div>}

'use client';
import {useEffect} from 'react';

export default function CryptoAdSlot({slot='homepage'}){
  const client=process.env.NEXT_PUBLIC_AD_CLIENT;
  const slotId=process.env.NEXT_PUBLIC_AD_SLOT;
  useEffect(()=>{
    if(!client||!slotId) return;
    const id='voxelvault-ad-network';
    if(!document.getElementById(id)){
      const script=document.createElement('script');
      script.id=id; script.async=true;
      script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      script.crossOrigin='anonymous';
      document.head.appendChild(script);
    }
    const timer=setTimeout(()=>{try{window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.push({});}catch{}},400);
    return()=>clearTimeout(timer);
  },[client,slotId]);

  if(!client||!slotId) return <aside className="vvAd vvAdReady" aria-label="Sponsored placement"><span>ADVERTISEMENT</span><strong>Web3 / 3D creator spotlight</strong><small>Monetization slot ready. Add your approved ad-network IDs to turn on live ads.</small><style jsx>{`.vvAd{margin:24px auto;max-width:1320px;min-height:82px;border:1px solid #202437;border-radius:14px;background:linear-gradient(100deg,#090b12,#100d1b);display:flex;align-items:center;justify-content:center;gap:16px;padding:18px 24px;text-align:center}.vvAd span{font-size:7px;letter-spacing:2px;color:#756c95}.vvAd strong{font-size:12px}.vvAd small{color:#70778a;font-size:9px}.vvAdReady{flex-wrap:wrap}@media(max-width:700px){.vvAd{display:block}.vvAd>*{display:block;margin:4px auto}}`}</style></aside>;

  return <aside className="vvAd" aria-label="Advertisement"><ins className="adsbygoogle" style={{display:'block'}} data-ad-client={client} data-ad-slot={slotId} data-ad-format="auto" data-full-width-responsive="true" data-ad-region={slot}/><style jsx>{`.vvAd{margin:24px auto;max-width:1320px;min-height:90px;padding:8px 5vw}`}</style></aside>;
}

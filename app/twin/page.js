'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCatalogItem } from '../../lib/catalog';

const Product3DTwin = dynamic(() => import('../components/Product3DTwin'), { ssr: false });

function TwinExperience(){
  const params = useSearchParams();
  const catalogId = Number(params.get('asset') || 1);
  const item = useMemo(() => getCatalogItem(catalogId - 1), [catalogId]);
  const validId = item ? catalogId : 1;
  const resolved = item || getCatalogItem(0);

  return <main className="vv-twinPage">
    <header className="vv-twinNav"><Link href="/" className="vv-twinBrand">VOXEL VAULT</Link><span>ON-CHAIN 3D TWIN</span><Link href={`/mint?catalog=${validId}`} className="vv-twinCollect">Collect ↗</Link></header>
    <section className="vv-twinStage">
      <div className="vv-twinStageGrid" aria-hidden="true" />
      <div className="vv-twinStageMeta"><span>ORIGINAL VOXEL VAULT DIGITAL ASSET</span><span>INTERACTIVE · 3D · NFT READY</span></div>
      <div className="vv-twinViewer"><Product3DTwin item={resolved} hero /></div>
      <div className="vv-twinCaption"><div><small>REAL-WORLD REFERENCE</small><h1>{resolved.name}</h1><p>{resolved.realityBasis}</p></div><div className="vv-twinFacts"><span>{resolved.creator}</span><span>{resolved.material}</span><span>{resolved.rarity}</span></div></div>
    </section>
    <section className="vv-twinInfo"><div><small>WHAT YOU ARE COLLECTING</small><h2>A real 3D collectible, not a flat product card.</h2></div><p>This is the permanent interactive 3D presentation target for the Voxel Vault NFT. The storefront may link to published model sources for product inspection, while the collectible itself is rendered by Voxel Vault's native 3D twin engine.</p></section>
    <footer><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href={`/mint?catalog=${validId}`}>Mint / collect</Link></footer>
    <style jsx>{`.vv-twinPage{min-height:100vh;background:#05060b;color:#f7f8fb;padding:0 18px 42px;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.vv-twinNav{height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:8px;font-weight:900;letter-spacing:.14em;color:#6f788b}.vv-twinNav>a{color:#fff;text-decoration:none}.vv-twinBrand{font-size:11px;letter-spacing:.16em}.vv-twinCollect{text-align:right;color:#b7a8ff!important}.vv-twinStage{position:relative;max-width:1180px;margin:24px auto 0;min-height:690px;border:1px solid rgba(255,255,255,.1);border-radius:28px;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(119,104,255,.14),transparent 42%),linear-gradient(180deg,#0b0d16,#05060b);box-shadow:0 35px 100px rgba(0,0,0,.45)}.vv-twinStageGrid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 50% 48%,#000,transparent 75%)}.vv-twinStageMeta{position:absolute;z-index:4;left:22px;right:22px;top:20px;display:flex;justify-content:space-between;gap:12px;color:#81899b;font-size:8px;font-weight:900;letter-spacing:.13em}.vv-twinViewer{position:absolute;inset:58px 18px 170px;min-height:430px}.vv-twinViewer>div{height:100%!important}.vv-twinCaption{position:absolute;z-index:4;left:22px;right:22px;bottom:22px;display:flex;justify-content:space-between;gap:20px;align-items:end}.vv-twinCaption small,.vv-twinInfo small{color:#a895ff;font-size:8px;font-weight:900;letter-spacing:.15em}.vv-twinCaption h1{margin:7px 0 3px;font-size:clamp(30px,5vw,54px);line-height:.95;letter-spacing:-.05em}.vv-twinCaption p{margin:0;color:#7e8799;font-size:10px}.vv-twinFacts{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.vv-twinFacts span{border:1px solid rgba(255,255,255,.11);background:rgba(5,6,11,.65);border-radius:999px;padding:8px 10px;color:#d9deea;font-size:8px;font-weight:800}.vv-twinInfo{max-width:1180px;margin:18px auto 0;padding:25px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(255,255,255,.025);display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,1fr);gap:28px}.vv-twinInfo h2{margin:8px 0 0;max-width:650px;font-size:clamp(26px,4vw,44px);line-height:.98;letter-spacing:-.05em}.vv-twinInfo p{margin:0;color:#7d8698;font-size:11px;line-height:1.65;align-self:end}.vv-twinPage footer{max-width:1180px;margin:18px auto 0;display:flex;justify-content:center;gap:18px}.vv-twinPage footer a{color:#667084;text-decoration:none;font-size:9px}@media(max-width:700px){.vv-twinNav{grid-template-columns:1fr auto}.vv-twinNav>span{display:none}.vv-twinStage{min-height:610px;border-radius:20px}.vv-twinStageMeta{font-size:7px}.vv-twinStageMeta span:last-child{display:none}.vv-twinViewer{inset:58px 8px 185px}.vv-twinCaption{display:block;left:16px;right:16px;bottom:16px}.vv-twinFacts{justify-content:flex-start;margin-top:10px}.vv-twinInfo{grid-template-columns:1fr;padding:20px}.vv-twinInfo p{font-size:10px}}`}</style>
  </main>;
}

export default function TwinPage(){
  return <Suspense fallback={<main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#05060b',color:'#fff'}}>Loading 3D twin…</main>}><TwinExperience/></Suspense>;
}

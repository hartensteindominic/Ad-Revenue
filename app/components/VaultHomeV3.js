'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { getCatalogWindow } from '../../lib/catalog';

const Lazy3DPreview = dynamic(() => import('./Lazy3DPreview'), { ssr: false });
const VoxelViewer = dynamic(() => import('./VoxelViewer'), { ssr: false });
const ArtPreview = dynamic(() => import('./ArtPreview'), { ssr: false });

const items = getCatalogWindow(0, 8);
const categories = ['All objects', 'Artifacts', 'Wearables', 'Art', 'Food'];

function ObjectModel({ item, hero = false }) {
  if (!item) return null;
  return (
    <Lazy3DPreview minHeight={hero ? 500 : 260} rootMargin={hero ? '0px' : '600px'}>
      {item.renderMode === 'voxel' && item.shape ? (
        <VoxelViewer shape={item.shape} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} />
      ) : (
        <ArtPreview family={item.family || 'sculpture'} seed={item.seed} rarity={item.rarity} material={item.material} compact label={false} />
      )}
    </Lazy3DPreview>
  );
}

function ObjectCard({ item, index }) {
  return (
    <Link className="objectCard" href={`/marketplace?asset=${encodeURIComponent(item.id)}`}>
      <div className="objectVisual">
        <ObjectModel item={item} />
        <span className="cardIndex">0{index + 1}</span>
        <span className="objectBadge"><i /> LIVE TWIN</span>
        <span className="viewObject">VIEW IN 3D ↗</span>
      </div>
      <div className="objectDetails">
        <div>
          <small>{item.type || 'DIGITAL OBJECT'}</small>
          <h3>{item.name}</h3>
        </div>
        <strong>${item.priceUsd}</strong>
      </div>
      <div className="objectMeta"><span>PHYSICAL + DIGITAL</span><span>{item.rarity || 'ORIGINAL'}</span></div>
    </Link>
  );
}

export default function VaultHomeV3() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All objects');
  const heroItem = items[0];
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.name} ${item.type} ${item.creator} ${item.material} ${item.family}`.toLowerCase();
    const categoryMatch = category === 'All objects' || category === 'Artifacts' || haystack.includes(category.replace(/s$/, '').toLowerCase());
    return (!query || haystack.includes(query.toLowerCase())) && categoryMatch;
  }), [query, category]);

  return (
    <main className="vvHome">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="Voxel Vault home">
          <span className="mark"><i /><i /><i /></span>
          <span>VOXEL <b>VAULT</b></span>
        </Link>
        <nav className="desktopNav" aria-label="Primary navigation">
          <Link href="/discover">Discover</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/room">My room</Link>
          <Link href="/ai">Intelligence</Link>
        </nav>
        <div className="topActions">
          <Link className="searchIcon" href="#collection" aria-label="Search the collection">⌕</Link>
          <Link className="vaultButton" href="/room"><span>Enter vault</span><b>↗</b></Link>
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <div className="signal"><i /> THE PHYSICAL–DIGITAL NETWORK</div>
          <h1>OWN THE OBJECT.<br /><em>UNLOCK ITS WORLD.</em></h1>
          <p>Every real-world purchase becomes an intelligent 3D collectible—verified, explorable, and truly yours.</p>
          <div className="heroActions">
            <Link className="primaryCta" href="/discover"><span>Explore objects</span><b>↗</b></Link>
            <Link className="playCta" href="/room"><i>▶</i><span>Enter the experience</span></Link>
          </div>
          <div className="trustRow">
            <span><b>01</b> VERIFIED RECEIPTS</span>
            <span><b>02</b> INTERACTIVE 3D</span>
            <span><b>03</b> ONCHAIN PROVENANCE</span>
          </div>
        </div>

        <div className="heroWorld" aria-label="Interactive featured digital twin">
          <div className="orbit orbitOne" /><div className="orbit orbitTwo" />
          <div className="heroGrid" />
          <div className="modelStage"><ObjectModel item={heroItem} hero /></div>
          <div className="objectLabel">
            <small>GENESIS OBJECT / 001</small>
            <strong>{heroItem?.name || 'Vault Artifact'}</strong>
            <span>Drag to inspect · Live 3D</span>
          </div>
          <div className="verifiedChip"><span>✓</span><div><small>AUTHENTICITY</small><b>VERIFIED</b></div></div>
          <div className="coordinates">40.7128° N<br />74.0060° W</div>
        </div>
      </section>

      <section className="ticker" aria-label="Platform capabilities">
        <div><span>VOXEL VAULT</span><i>✦</i><span>PHYSICAL OBJECTS</span><i>✦</i><span>3D DIGITAL TWINS</span><i>✦</i><span>VERIFIED OWNERSHIP</span><i>✦</i><span>AI INTELLIGENCE</span></div>
      </section>

      <section className="manifesto">
        <span className="sectionNumber">/ 01</span>
        <div><small>NOT ANOTHER MARKETPLACE</small><h2>Your things deserve<br /><em>a second life.</em></h2></div>
        <p>Voxel Vault connects what you own in the physical world to a living digital identity. Scan the proof. Generate the twin. Explore the story.</p>
      </section>

      <section className="journey">
        <Link href="/receipt"><span>01</span><i>▣</i><div><small>CAPTURE</small><h3>Verify the purchase</h3><p>Turn a merchant-confirmed receipt into a secure object passport.</p></div><b>↗</b></Link>
        <Link href="/passport"><span>02</span><i>◈</i><div><small>TRANSFORM</small><h3>Create the twin</h3><p>AI-enriched metadata and an interactive 3D form bring it online.</p></div><b>↗</b></Link>
        <Link href="/room"><span>03</span><i>◇</i><div><small>EXPERIENCE</small><h3>Build your world</h3><p>Collect, organize, share, and explore everything you own.</p></div><b>↗</b></Link>
      </section>

      <section className="collection" id="collection">
        <div className="collectionHead">
          <div><small>LIVE COLLECTION / 2026</small><h2>Objects worth<br /><em>discovering.</em></h2></div>
          <p>A growing universe of physical objects and their interactive digital counterparts.</p>
        </div>
        <div className="collectionTools">
          <div className="categories">{categories.map((name) => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <label className="searchBox"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects" /></label>
        </div>
        <div className="objectGrid">{filtered.map((item, index) => <ObjectCard key={item.id} item={item} index={index} />)}</div>
        {!filtered.length && <div className="emptyState">No objects found. Try another signal.</div>}
        <Link className="viewAll" href="/marketplace"><span>View the full collection</span><b>↗</b></Link>
      </section>

      <section className="intelligence">
        <div className="intelligenceVisual"><div className="aiCore"><span>✦</span></div><i className="aiRing ringA" /><i className="aiRing ringB" /><small>CRESTODIAN / ONLINE</small></div>
        <div className="intelligenceCopy"><small>OBJECT INTELLIGENCE</small><h2>A vault that<br /><em>understands.</em></h2><p>Ask what an object is, where it came from, what makes it rare, and how it connects to your collection.</p><ul><li><i /> Collection intelligence</li><li><i /> Provenance research</li><li><i /> Spatial organization</li></ul><Link href="/ai">Meet Crestodian <b>↗</b></Link></div>
      </section>

      <footer>
        <Link href="/" className="footerMark">VV<span>®</span></Link>
        <div><strong>THE WORLD IS FULL OF<br />OBJECTS WORTH KEEPING.</strong><p>Voxel Vault gives them a digital life.</p></div>
        <nav><Link href="/discover">Discover</Link><Link href="/receipt">Scan</Link><Link href="/room">Vault</Link><Link href="/ai">AI</Link></nav>
        <small>© 2026 VOXEL VAULT</small>
      </footer>

      <nav className="mobileNav" aria-label="Mobile navigation"><Link className="active" href="/discover"><span>⌂</span>Discover</Link><Link href="/receipt"><span>▣</span>Scan</Link><Link href="/room"><span>◇</span>Vault</Link><Link href="/ai"><span>✦</span>AI</Link></nav>

      <style jsx>{`
        :global(html){scroll-behavior:smooth;background:#050608}:global(body){margin:0;background:#050608}.vvHome{--acid:#b7ff2a;--violet:#9d7bff;--cyan:#55e8ff;position:relative;overflow:hidden;min-height:100vh;background:#050608;color:#f5f6f0;font-family:Inter,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.01em}.vvHome *{box-sizing:border-box}.vvHome a{color:inherit;text-decoration:none}.ambient{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;opacity:.13}.ambientOne{width:620px;height:620px;background:var(--violet);right:-250px;top:180px}.ambientTwo{width:500px;height:500px;background:var(--cyan);left:-350px;top:1450px}.topbar{height:86px;max-width:1440px;margin:auto;padding:0 42px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.09);position:relative;z-index:20}.wordmark{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:900;letter-spacing:.08em}.wordmark b{color:#8d93a0;font-weight:700}.mark{width:31px;height:31px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;transform:skewY(-8deg)}.mark i{display:block;background:var(--acid);box-shadow:0 0 18px rgba(183,255,42,.2)}.mark i:nth-child(2){opacity:.7}.mark i:nth-child(3){opacity:.35}.desktopNav{display:flex;gap:33px}.desktopNav a{font-size:11px;color:#9297a2;transition:.2s}.desktopNav a:hover{color:#fff}.topActions{display:flex;align-items:center;gap:12px}.searchIcon{width:39px;height:39px;border:1px solid #292c34;display:grid;place-items:center;border-radius:50%;font-size:19px}.vaultButton,.primaryCta{display:flex;align-items:center;gap:30px;background:var(--acid);color:#080a05!important;padding:13px 15px 13px 18px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.vaultButton b,.primaryCta b{font-size:15px}.hero{max-width:1440px;min-height:720px;margin:auto;padding:0 42px;display:grid;grid-template-columns:52% 48%;border-bottom:1px solid rgba(255,255,255,.09)}.heroCopy{position:relative;z-index:3;padding:112px 30px 70px 0;display:flex;flex-direction:column;align-items:flex-start}.signal,.collection small,.manifesto small,.intelligence small{font-size:9px;letter-spacing:.2em;font-weight:900;color:#9298a5}.signal i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--acid);box-shadow:0 0 14px var(--acid);margin-right:9px}.hero h1{font-size:clamp(55px,6vw,94px);line-height:.87;letter-spacing:-.07em;margin:27px 0 29px;font-weight:900}.hero h1 em,.manifesto h2 em,.collection h2 em,.intelligence h2 em{font-style:normal;color:transparent;-webkit-text-stroke:1px #7d838e}.heroCopy>p{max-width:570px;font-size:17px;line-height:1.55;color:#9399a5;margin:0}.heroActions{display:flex;align-items:center;gap:26px;margin-top:37px}.primaryCta{padding:16px 17px 16px 21px;gap:47px}.playCta{display:flex;align-items:center;gap:11px;font-size:11px;color:#c6cad1!important}.playCta i{font-style:normal;width:39px;height:39px;border:1px solid #393d47;border-radius:50%;display:grid;place-items:center;font-size:9px}.trustRow{margin-top:auto;width:100%;display:flex;gap:31px;border-top:1px solid #1c1f25;padding-top:23px}.trustRow span{font-size:8px;letter-spacing:.11em;color:#6e7480}.trustRow b{color:var(--acid);margin-right:6px}.heroWorld{position:relative;min-height:720px;border-left:1px solid rgba(255,255,255,.09);background:radial-gradient(circle at 52% 44%,rgba(157,123,255,.24),transparent 32%),radial-gradient(circle at 52% 46%,rgba(85,232,255,.08),transparent 52%)}.heroGrid{position:absolute;inset:0;opacity:.14;background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(to bottom,transparent 2%,#000 30%,#000 80%,transparent)}.modelStage{position:absolute;inset:38px 0 80px;z-index:3}.modelStage :global(canvas){width:100%!important;height:100%!important;display:block}.orbit{position:absolute;left:50%;top:46%;border:1px solid rgba(183,255,42,.2);border-radius:50%;transform:translate(-50%,-50%) rotateX(66deg);z-index:2}.orbitOne{width:500px;height:500px;animation:orbit 18s linear infinite}.orbitTwo{width:630px;height:630px;border-style:dashed;border-color:rgba(157,123,255,.18);animation:orbit 30s linear infinite reverse}@keyframes orbit{to{transform:translate(-50%,-50%) rotateX(66deg) rotateZ(360deg)}}.objectLabel{position:absolute;left:27px;bottom:28px;z-index:5;display:flex;flex-direction:column}.objectLabel small{font-size:7px;letter-spacing:.19em;color:var(--acid)}.objectLabel strong{font-size:18px;margin:6px 0 3px}.objectLabel span{font-size:8px;color:#707681}.verifiedChip{position:absolute;right:20px;top:37px;z-index:5;background:rgba(9,11,15,.75);backdrop-filter:blur(12px);border:1px solid #2c3039;padding:10px 13px;display:flex;gap:10px;align-items:center}.verifiedChip>span{width:25px;height:25px;background:var(--acid);color:#080a05;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:900}.verifiedChip small,.verifiedChip b{display:block;font-size:7px;letter-spacing:.14em}.verifiedChip small{color:#686f7b;margin-bottom:3px}.coordinates{position:absolute;right:22px;bottom:26px;font:7px/1.5 monospace;color:#5f6570;text-align:right}.ticker{border-bottom:1px solid #1c1f25;overflow:hidden;white-space:nowrap;background:#08090c}.ticker div{display:flex;justify-content:space-around;align-items:center;min-width:1100px;height:50px;font-size:8px;letter-spacing:.18em;font-weight:900;color:#878d98}.ticker i{color:var(--acid);font-style:normal}.manifesto{max-width:1356px;margin:0 auto;padding:130px 0 75px;display:grid;grid-template-columns:12% 51% 37%;align-items:end}.sectionNumber{align-self:start;color:var(--acid);font:9px monospace}.manifesto h2,.collection h2,.intelligence h2{font-size:clamp(50px,5.6vw,82px);line-height:.92;letter-spacing:-.065em;margin:16px 0 0}.manifesto>p{color:#8b919c;line-height:1.7;font-size:14px;max-width:390px;margin:0 0 8px}.journey{max-width:1356px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #20232a}.journey>a{min-height:265px;padding:24px 27px;position:relative;border-right:1px solid #20232a;display:flex;flex-direction:column;transition:.3s;background:rgba(10,11,15,.6)}.journey>a:last-child{border-right:0}.journey>a:hover{background:#0e1115;transform:translateY(-4px);border-top:2px solid var(--acid)}.journey>a>span{font:8px monospace;color:#595f69}.journey>a>i{font-style:normal;font-size:37px;color:var(--acid);margin:29px 0 auto}.journey h3{font-size:20px;margin:7px 0 9px}.journey small{font-size:7px;color:#757b86;letter-spacing:.18em}.journey p{font-size:11px;line-height:1.55;color:#6f7580;max-width:285px;margin:0}.journey>a>b{position:absolute;right:25px;top:23px;color:#646b76;font-size:15px}.collection{max-width:1356px;margin:0 auto;padding:150px 0 120px}.collectionHead{display:grid;grid-template-columns:2fr 1fr;align-items:end}.collectionHead>p{color:#7b818c;font-size:13px;line-height:1.65;max-width:350px;margin:0 0 8px}.collectionTools{display:flex;align-items:center;justify-content:space-between;margin:52px 0 23px;border-bottom:1px solid #22252c}.categories{display:flex;gap:28px}.categories button{border:0;background:transparent;color:#686e79;font-size:9px;padding:0 0 15px;cursor:pointer;letter-spacing:.06em}.categories button.active{color:#fff;border-bottom:2px solid var(--acid)}.searchBox{display:flex;align-items:center;gap:7px;padding-bottom:13px}.searchBox span{font-size:16px;color:#7b818b}.searchBox input{width:150px;border:0;outline:0;background:transparent;color:#fff;font-size:10px}.objectGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.objectCard{background:#090b0e;border:1px solid #1d2026;transition:.35s;overflow:hidden}.objectCard:hover{transform:translateY(-7px);border-color:#464c57;box-shadow:0 25px 70px rgba(0,0,0,.4)}.objectVisual{height:300px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(157,123,255,.17),transparent 43%),#08090c}.objectVisual:after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 72%,rgba(4,5,7,.75));pointer-events:none}.objectVisual :global(canvas){display:block;width:100%!important;height:100%!important}.cardIndex{position:absolute;z-index:3;left:13px;top:13px;font:8px monospace;color:#555c67}.objectBadge{position:absolute;z-index:3;left:13px;bottom:12px;font-size:7px;letter-spacing:.13em}.objectBadge i{display:inline-block;width:5px;height:5px;background:var(--acid);border-radius:50%;box-shadow:0 0 9px var(--acid);margin-right:5px}.viewObject{position:absolute;z-index:3;right:13px;bottom:12px;font-size:7px;opacity:0;transition:.3s}.objectCard:hover .viewObject{opacity:1}.objectDetails{display:flex;justify-content:space-between;gap:8px;padding:16px 15px 8px}.objectDetails small{font-size:6px;color:#666d78;letter-spacing:.12em}.objectDetails h3{font-size:14px;margin:5px 0}.objectDetails strong{font-size:12px}.objectMeta{display:flex;justify-content:space-between;padding:0 15px 15px;color:#555c67;font-size:6px;letter-spacing:.1em}.emptyState{padding:80px;border:1px solid #20232a;text-align:center;color:#6e7480}.viewAll{width:max-content;margin:38px auto 0;border-bottom:1px solid #4b515c;padding:12px 0;display:flex;gap:65px;text-transform:uppercase;font-size:9px;letter-spacing:.1em}.viewAll b{color:var(--acid)}.intelligence{max-width:1356px;min-height:600px;margin:0 auto 120px;display:grid;grid-template-columns:1.08fr .92fr;border:1px solid #21242b;background:radial-gradient(circle at 23% 50%,rgba(157,123,255,.18),transparent 35%),#08090c}.intelligenceVisual{position:relative;display:grid;place-items:center;overflow:hidden;border-right:1px solid #20232a}.aiCore{width:125px;height:125px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#d8cfff,#7651ed 50%,#17102b);box-shadow:0 0 65px rgba(157,123,255,.6),0 0 150px rgba(85,232,255,.15);position:relative;z-index:2}.aiCore span{font-size:35px}.aiRing{position:absolute;border:1px solid rgba(183,255,42,.22);border-radius:50%;width:320px;height:320px}.ringA{animation:spin 15s linear infinite}.ringB{width:460px;height:460px;border-style:dashed;border-color:rgba(157,123,255,.25);animation:spin 28s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}.intelligenceVisual>small{position:absolute;left:23px;bottom:22px;font:7px monospace;color:var(--acid)}.intelligenceCopy{padding:85px 70px;display:flex;flex-direction:column;align-items:flex-start}.intelligenceCopy h2{font-size:65px}.intelligenceCopy>p{font-size:14px;line-height:1.7;color:#838995;max-width:410px;margin:28px 0}.intelligence ul{list-style:none;padding:0;margin:0 0 30px}.intelligence li{font-size:10px;color:#a6abb4;margin:11px 0}.intelligence li i{display:inline-block;width:5px;height:5px;background:var(--acid);margin-right:10px}.intelligenceCopy>a{background:#fff;color:#07080a;padding:14px 18px;font-size:9px;text-transform:uppercase;font-weight:900;display:flex;gap:45px}.intelligenceCopy>a b{color:#627000}footer{max-width:1356px;margin:auto;border-top:1px solid #20232a;padding:65px 0 35px;display:grid;grid-template-columns:.5fr 1.5fr .8fr auto;gap:30px;align-items:start}.footerMark{font-size:43px;font-weight:1000;letter-spacing:-.08em}.footerMark span{font-size:8px;color:var(--acid);vertical-align:top}.footerMark+div strong{font-size:14px;line-height:1.4}.footerMark+div p{font-size:10px;color:#646a75}.vvHome footer nav{display:grid;grid-template-columns:repeat(2,1fr);gap:11px 30px}.vvHome footer nav a{font-size:9px;color:#7c828d}.vvHome footer>small{font-size:7px;color:#4e545e}.mobileNav{display:none}
        @media(max-width:1100px){.topbar,.hero{padding-left:24px;padding-right:24px}.manifesto,.journey,.collection,.intelligence,footer{margin-left:24px;margin-right:24px}.hero h1{font-size:62px}.manifesto{grid-template-columns:8% 58% 34%}.objectGrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:760px){.vvHome{padding-bottom:82px}.topbar{height:67px;padding:0 17px}.wordmark{font-size:11px}.mark{width:27px;height:27px}.desktopNav,.searchIcon,.vaultButton{display:none}.hero{display:flex;flex-direction:column;min-height:0;padding:0 17px;border-bottom:0}.heroCopy{padding:70px 0 40px}.hero h1{font-size:54px;margin:21px 0}.heroCopy>p{font-size:14px;max-width:360px}.heroActions{margin-top:28px}.primaryCta{padding:14px 15px;gap:27px}.playCta span{display:none}.trustRow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:46px}.heroWorld{min-height:520px;border:1px solid #20232a}.modelStage{inset:30px 0 65px}.orbitOne{width:320px;height:320px}.orbitTwo{width:410px;height:410px}.verifiedChip{right:12px;top:12px}.objectLabel{left:14px;bottom:17px}.coordinates{display:none}.ticker{margin-top:18px}.manifesto{margin:0;padding:95px 18px 45px;display:block}.sectionNumber{display:block;margin-bottom:34px}.manifesto h2,.collection h2,.intelligenceCopy h2{font-size:49px}.manifesto>p{margin-top:28px}.journey{margin:0 17px;display:block}.journey>a{min-height:220px;border-right:0;border-bottom:1px solid #20232a}.journey>a:last-child{border-bottom:0}.collection{margin:0;padding:100px 17px 80px}.collectionHead{display:block}.collectionHead>p{margin-top:24px}.collectionTools{display:block;margin-top:38px}.categories{overflow:auto;gap:22px;scrollbar-width:none}.categories::-webkit-scrollbar{display:none}.categories button{white-space:nowrap}.searchBox{border-top:1px solid #20232a;padding-top:14px}.searchBox input{width:100%}.objectGrid{grid-template-columns:1fr 1fr;gap:7px}.objectVisual{height:220px}.objectDetails{padding:12px 10px 6px}.objectDetails h3{font-size:12px;max-width:105px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.objectMeta{padding:0 10px 12px}.objectMeta span:last-child{display:none}.viewObject{display:none}.intelligence{margin:0 17px 80px;display:flex;flex-direction:column;min-height:0}.intelligenceVisual{height:390px;border-right:0;border-bottom:1px solid #20232a}.aiCore{width:96px;height:96px}.aiRing{width:250px;height:250px}.ringB{width:350px;height:350px}.intelligenceCopy{padding:50px 24px}.intelligenceCopy h2{font-size:50px}.intelligenceCopy>p{margin-top:22px}footer{margin:0 17px;padding:45px 0 10px;grid-template-columns:1fr 1fr}.footerMark+div{grid-column:2}.vvHome footer nav{grid-column:1/3;margin-top:22px}.vvHome footer>small{grid-column:1/3}.mobileNav{display:grid;position:fixed;z-index:30;left:10px;right:10px;bottom:10px;height:65px;grid-template-columns:repeat(4,1fr);background:rgba(11,13,17,.9);backdrop-filter:blur(22px);border:1px solid #2a2e36;border-radius:18px;box-shadow:0 18px 60px #000}.mobileNav a{display:grid;place-items:center;align-content:center;gap:3px;font-size:7px;color:#727985}.mobileNav a span{font-size:17px}.mobileNav a.active{color:#fff}.mobileNav a.active span{color:var(--acid)}}
        @media(max-width:380px){.hero h1{font-size:46px}.objectVisual{height:190px}.objectDetails strong{font-size:10px}.manifesto h2,.collection h2,.intelligenceCopy h2{font-size:42px}}
        @media(prefers-reduced-motion:reduce){.orbit,.aiRing{animation:none!important}.objectCard{transition:none}}
      `}</style>
    </main>
  );
}

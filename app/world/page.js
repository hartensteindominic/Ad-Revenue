import { NFT_WORLD_CATALOG } from '../../lib/world/nftWorldCatalog.js';

export const metadata = { title: 'NFT World', description: 'Explore a living gallery of deterministic Voxel Vault collectibles, discoveries and clearly disclosed sponsored drops.' };

export default function NFTWorldPage() {
  return (
    <main className="world">
      <header className="worldHeader">
        <a href="/">✦ Voxel Vault</a>
        <span>WORLD / {NFT_WORLD_CATALOG.length} NEW OBJECTS</span>
      </header>
      <section className="hero">
        <div className="eyebrow">✦ NFT WORLD · LIVING COLLECTION</div>
        <h1>A world that keeps <em>changing.</em></h1>
        <p>Explore procedural collectibles, hunt-ready objects and sponsored discoveries. Sponsored objects are always labeled. The game stays free.</p>
        <div className="stats"><span><b>{NFT_WORLD_CATALOG.length}</b> featured objects</span><span><b>{NFT_WORLD_CATALOG.filter(x => x.sponsored).length}</b> sponsored drops</span><span><b>∞</b> deterministic variations</span></div>
      </section>
      <section className="grid">
        {NFT_WORLD_CATALOG.map((nft) => (
          <article className="card" key={nft.id}>
            <div className={`orb ${nft.rarity.toLowerCase()}`} style={{ '--h': `${(nft.id * 37) % 360}` }}>
              <div className="core" /><i /><i /><i />
            </div>
            <div className="meta"><span>{nft.rarity}</span><span>{nft.family}</span></div>
            <h2>{nft.name}</h2>
            <p>{nft.material} · {nft.creator}</p>
            <div className="bottom"><strong>{nft.price} ETH</strong>{nft.sponsored ? <small>Sponsored Discovery</small> : <small>Voxel Vault Original</small>}</div>
          </article>
        ))}
      </section>
      <style>{`
        .world{min-height:100vh;background:#05060b;color:#f5f5ff;padding:28px 5vw 80px;font-family:Inter,system-ui,sans-serif}.worldHeader{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1c2030;padding-bottom:18px;color:#8d93a7;font-size:11px;letter-spacing:.14em}.worldHeader a{color:#fff;text-decoration:none;font-size:16px;font-weight:900;letter-spacing:.04em}.hero{max-width:900px;padding:90px 0 55px}.eyebrow{font-size:10px;letter-spacing:.18em;color:#9a8cff;font-weight:800}.hero h1{font-size:clamp(44px,8vw,86px);line-height:.96;letter-spacing:-.055em;margin:18px 0}.hero h1 em{color:#9d8bff;font-style:normal}.hero p{max-width:680px;color:#9aa2b5;line-height:1.7;font-size:16px}.stats{display:flex;gap:30px;flex-wrap:wrap;margin-top:32px;color:#70788e;font-size:12px}.stats b{display:block;color:#fff;font-size:20px;margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{background:linear-gradient(180deg,#101321,#090b12);border:1px solid #202437;border-radius:20px;padding:16px;overflow:hidden;transition:transform .2s,border-color .2s}.card:hover{transform:translateY(-3px);border-color:#4b466f}.orb{height:240px;border-radius:14px;display:grid;place-items:center;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 45%,hsla(var(--h),80%,70%,.18),transparent 44%),#080b13}.core{width:90px;height:90px;border-radius:28% 55% 40% 60%;transform:rotate(27deg);background:linear-gradient(135deg,hsl(var(--h),80%,75%),hsl(calc(var(--h) + 55),70%,38%));box-shadow:0 0 70px hsla(var(--h),90%,70%,.28),inset 10px 8px 20px rgba(255,255,255,.2)}.orb i{position:absolute;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5);box-shadow:0 0 15px rgba(255,255,255,.4)}.orb i:nth-child(2){transform:translate(100px,-70px)}.orb i:nth-child(3){transform:translate(-90px,75px)}.orb i:nth-child(4){transform:translate(120px,80px)}.meta{display:flex;justify-content:space-between;margin-top:14px;color:#858ca1;font-size:10px;text-transform:uppercase;letter-spacing:.12em}.card h2{font-size:22px;margin:8px 0 4px}.card p{color:#777f94;font-size:12px;margin:0}.bottom{display:flex;justify-content:space-between;align-items:center;margin-top:18px}.bottom strong{font-size:15px}.bottom small{color:#777f94;font-size:10px}.legendary .core,.mythic .core{box-shadow:0 0 90px hsla(var(--h),90%,70%,.42),inset 10px 8px 20px rgba(255,255,255,.2)}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.world{padding:20px 16px 60px}.hero{padding:60px 0 38px}.grid{grid-template-columns:1fr}.worldHeader span{display:none}.orb{height:210px}}
      `}</style>
    </main>
  );
}

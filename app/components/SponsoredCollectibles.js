'use client';

import { useMemo } from 'react';
import { SPONSOR_READY_CONCEPTS } from '../../lib/sponsoredCollectibles';

function mediaLabel(media) {
  return media === 'mixed' ? '3D + 2D' : media === '3d' ? '3D native' : '2D collectible';
}

export default function SponsoredCollectibles() {
  const concepts = useMemo(() => SPONSOR_READY_CONCEPTS, []);

  return (
    <section className="sponsoredLayer" id="sponsored-collectibles" aria-labelledby="sponsored-title">
      <div className="sponsoredIntro">
        <div>
          <div className="eyebrow">COLLECTIBLE MEDIA NETWORK</div>
          <h2 id="sponsored-title">The collectible <em>is the campaign.</em></h2>
          <p>
            Voxel Vault can let brands, artists, games, events and communities fund collectible drops instead of buying ordinary banner space.
            The object stays collectible. Sponsorship is disclosed, measured and never treated as proof of ownership.
          </p>
        </div>
        <div className="sponsorRules" aria-label="Sponsored collectible principles">
          <span>✓ Disclosure on the object</span>
          <span>✓ Wallet still authorizes ownership</span>
          <span>✓ Blockchain remains authoritative</span>
          <span>✓ QR first, BLE enhancement</span>
        </div>
      </div>

      <div className="sponsoredGrid">
        {concepts.map((item) => (
          <article className="sponsoredCard" key={item.id}>
            <div className="sponsoredVisual" aria-hidden="true">
              <div className="sponsorOrb" />
              <div className="sponsorCube"><span /><span /><span /></div>
              <div className="sponsorScanline" />
              <span className="sponsorMedia">{mediaLabel(item.media)}</span>
            </div>
            <div className="sponsoredBody">
              <div className="sponsoredTopline">
                <span className="sponsoredBadge">SPONSOR-READY</span>
                <span>{item.rarity}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="sponsorDisclosure">
                <span>Campaign</span>
                <strong>{item.sponsorName}</strong>
                <small>{item.disclosure}</small>
              </div>
              <button type="button" className="sponsorCta" onClick={() => window.location.assign('/sponsors')}>
                Build a campaign →
              </button>
            </div>
          </article>
        ))}
      </div>

      <style jsx>{`
        .sponsoredLayer{max-width:1400px;margin:0 auto;padding:72px 5vw 92px;position:relative}
        .sponsoredIntro{display:grid;grid-template-columns:1.25fr .75fr;gap:34px;align-items:end;margin-bottom:30px}
        .sponsoredIntro h2{font-size:clamp(38px,5vw,72px);line-height:.95;letter-spacing:-.055em;margin:0 0 18px}
        .sponsoredIntro h2 em{font-style:normal;color:#a98cff}
        .sponsoredIntro p{max-width:720px;color:#a9afc1;line-height:1.75;margin:0}
        .sponsorRules{display:grid;gap:10px;padding:20px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:rgba(255,255,255,.025);color:#c8cde0;font-size:12px;line-height:1.4}
        .sponsoredGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .sponsoredCard{border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border-radius:24px;overflow:hidden;box-shadow:0 22px 80px rgba(0,0,0,.24)}
        .sponsoredVisual{height:220px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(153,112,255,.2),transparent 32%),linear-gradient(180deg,#0d1020,#07080e)}
        .sponsorOrb{position:absolute;width:180px;height:180px;border-radius:50%;left:50%;top:40%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(128,240,255,.28),rgba(128,112,255,.08) 42%,transparent 70%);filter:blur(2px)}
        .sponsorCube{position:absolute;left:50%;top:46%;width:88px;height:88px;transform:translate(-50%,-50%) rotate(45deg);border:1px solid rgba(178,156,255,.8);box-shadow:0 0 35px rgba(127,100,255,.35),inset 0 0 28px rgba(84,213,255,.12)}
        .sponsorCube span{position:absolute;inset:18px;border:1px solid rgba(87,224,255,.45)}
        .sponsorCube span:nth-child(1){transform:translateZ(18px)}.sponsorCube span:nth-child(2){transform:rotate(90deg) translateZ(18px)}.sponsorCube span:nth-child(3){transform:rotate(45deg) translateZ(28px)}
        .sponsorScanline{position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(117,228,255,.65);box-shadow:0 0 20px rgba(117,228,255,.5)}
        .sponsorMedia{position:absolute;left:14px;bottom:14px;font-size:9px;letter-spacing:.16em;color:#cfd5e7;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:6px 9px;background:rgba(0,0,0,.28)}
        .sponsoredBody{padding:20px}.sponsoredTopline{display:flex;justify-content:space-between;align-items:center;color:#8e95aa;font-size:10px;letter-spacing:.12em}.sponsoredBadge{color:#a98cff}.sponsoredBody h3{font-size:24px;letter-spacing:-.03em;margin:12px 0 9px}.sponsoredBody p{min-height:72px;color:#9da4b7;font-size:12px;line-height:1.65;margin:0 0 16px}.sponsorDisclosure{display:grid;gap:4px;padding:12px;border-radius:14px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.07);margin-bottom:14px}.sponsorDisclosure span,.sponsorDisclosure small{color:#737b91;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.sponsorDisclosure strong{font-size:12px;color:#eef0f8}.sponsorCta{width:100%;padding:11px 14px;border:1px solid rgba(169,140,255,.35);background:rgba(169,140,255,.08);color:#d8ceff;border-radius:12px;cursor:pointer;font-weight:800}.sponsorCta:hover{background:rgba(169,140,255,.15)}
        @media(max-width:900px){.sponsoredIntro{grid-template-columns:1fr}.sponsoredGrid{grid-template-columns:1fr}.sponsoredVisual{height:200px}}
      `}</style>
    </section>
  );
}

import { notFound } from 'next/navigation';
import Safe3DViewer from '../../components/Safe3DViewer';
import CollectorTools from '../../components/CollectorTools';
import { getCatalogItem } from '../../../lib/catalog';

export const dynamicParams = true;

function getItem(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  return getCatalogItem(n - 1);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) return { title: 'Asset not found | Voxel Vault' };
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');
  return {
    title: `${item.name} | Voxel Vault`,
    description: item.description,
    alternates: { canonical: `${base}/asset/${item.id}` },
    openGraph: { title: `${item.name} | Voxel Vault`, description: item.description, type: 'website', url: `${base}/asset/${item.id}`, images: [{ url: `${base}/api/og?asset=${item.id}`, width: 1200, height: 630, alt: item.name }] },
    twitter: { card: 'summary_large_image', title: `${item.name} | Voxel Vault`, description: item.description, images: [`${base}/api/og?asset=${item.id}`] },
  };
}

export default async function AssetPage({ params }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: item.name, description: item.description,
    url: `${base}/asset/${item.id}`, category: `3D digital ${item.type}`, brand: { '@type': 'Brand', name: 'Voxel Vault' },
    offers: { '@type': 'Offer', price: item.price, priceCurrency: 'ETH', availability: 'https://schema.org/InStock', url: `${base}/asset/${item.id}` },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Rarity', value: item.rarity },
      { '@type': 'PropertyValue', name: 'Material', value: item.material },
      { '@type': 'PropertyValue', name: 'Reality basis', value: item.realityBasis },
      { '@type': 'PropertyValue', name: 'Variant', value: item.variant },
      { '@type': 'PropertyValue', name: 'Creator', value: item.creator },
    ],
  };

  return (
    <main style={{ minHeight: '100vh', background: '#05060b', color: '#f7f8ff', fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif', padding: '20px clamp(14px,3vw,28px)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ color: '#9b84ff', textDecoration: 'none', fontSize: 12, letterSpacing: '.12em' }}>← VOXEL VAULT</a>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(300px,.85fr)', gap: 28, alignItems: 'center', marginTop: 20 }}>
          <div style={{ height: 'min(650px, 72vh)', minHeight: 420, minWidth: 0, border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, overflow: 'hidden', background: '#070811', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Safe3DViewer
                shape={item.shape}
                family={item.family}
                material={item.material}
                rarity={item.rarity}
                seed={item.seed}
                interactive
                showcase={false}
                label={false}
                compact={false}
                previewProps={{ family: item.family, material: item.material, seed: item.seed, interactive: true, showcase: false }}
              />
            </div>
            <div style={{ position: 'absolute', left: 16, bottom: 14, pointerEvents: 'none', color: 'rgba(255,255,255,.42)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' }}>Drag to inspect · pinch to zoom</div>
          </div>
          <section>
            <div style={{ color: '#9b84ff', fontSize: 10, letterSpacing: '.2em', fontWeight: 800 }}>3D DIGITAL OBJECT · {item.rarity.toUpperCase()}</div>
            <h1 style={{ fontSize: 'clamp(42px,6vw,78px)', lineHeight: .92, letterSpacing: '-.06em', margin: '16px 0' }}>{item.name}</h1>
            <p style={{ color: '#9aa0b2', lineHeight: 1.7 }}>{item.description}</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', borderBottom: '1px solid rgba(255,255,255,.1)', margin: '24px 0', padding: '8px 0' }}>
              <Row label="Creator" value={item.creator} /><Row label="Reality basis" value={item.realityBasis} /><Row label="Variant" value={item.variant} /><Row label="Material" value={item.material} /><Row label="Rarity" value={item.rarity} /><Row label="Price" value={`${item.price} ETH · ~$${item.priceUsd}`} />
            </div>
            <a href="/marketplace" style={{ display: 'inline-block', background: '#fff', color: '#06070b', borderRadius: 999, padding: '14px 20px', fontWeight: 800, textDecoration: 'none' }}>Collect in the Vault →</a>
            <CollectorTools assetId={item.id} name={item.name} />
            <p style={{ color: '#73798b', fontSize: 11, lineHeight: 1.6, marginTop: 16 }}>Collector note: the visual is generated from the object's deterministic seed and its declared reality basis, material, variant and rarity. Contract ownership is only represented after a verified on-chain transaction.</p>
          </section>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { main > div > div { grid-template-columns: 1fr !important; } main > div > div > div:first-child { height: min(68vh, 560px) !important; min-height: 360px !important; } }`}</style>
    </main>
  );
}

function Row({ label, value }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '10px 0', color: '#73798b', fontSize: 11 }}><span>{label}</span><b style={{ color: '#fff', textAlign: 'right' }}>{value}</b></div>;
}

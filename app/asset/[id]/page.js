import Link from 'next/link';
import { notFound } from 'next/navigation';
import VoxelViewer from '../../components/VoxelViewer';
import ArtPreview from '../../components/ArtPreview';
import CollectorTools from '../../components/CollectorTools';
import { getCatalogItem } from '../../../lib/catalog';
import styles from '../asset-page.module.css';

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
    openGraph: {
      title: `${item.name} | Voxel Vault`,
      description: item.description,
      type: 'website',
      url: `${base}/asset/${item.id}`,
      images: [{ url: `${base}/api/og?asset=${item.id}`, width: 1200, height: 630, alt: item.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.name} | Voxel Vault`,
      description: item.description,
      images: [`${base}/api/og?asset=${item.id}`],
    },
  };
}

export default async function AssetPage({ params }) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description,
    url: `${base}/asset/${item.id}`,
    category: `3D digital ${item.type}`,
    brand: { '@type': 'Brand', name: 'Voxel Vault' },
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'ETH',
      availability: 'https://schema.org/InStock',
      url: `${base}/asset/${item.id}`,
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Rarity', value: item.rarity },
      { '@type': 'PropertyValue', name: 'Material', value: item.material },
      { '@type': 'PropertyValue', name: 'Reality basis', value: item.realityBasis },
      { '@type': 'PropertyValue', name: 'Variant', value: item.variant },
      { '@type': 'PropertyValue', name: 'Creator', value: item.creator },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.shell}>
        <Link href="/" className={styles.back}>← VOXEL VAULT</Link>

        <div className={styles.grid}>
          <div className={styles.viewer} aria-label={`Interactive 3D preview of ${item.name}`}>
            {item.renderMode === 'voxel' ? (
              <VoxelViewer shape={item.shape} material={item.material} rarity={item.rarity} seed={item.seed} interactive showcase={false} label={false} />
            ) : (
              <ArtPreview family={item.family} material={item.material} seed={item.seed} interactive showcase={false} />
            )}
          </div>

          <section className={styles.info} aria-labelledby="asset-title">
            <div className={styles.eyebrow}>3D DIGITAL OBJECT · {item.rarity.toUpperCase()}</div>
            <h1 id="asset-title" className={styles.title}>{item.name}</h1>
            <p className={styles.description}>{item.description}</p>

            <div className={styles.specs}>
              <Row label="Creator" value={item.creator} />
              <Row label="Reality basis" value={item.realityBasis} />
              <Row label="Variant" value={item.variant} />
              <Row label="Material" value={item.material} />
              <Row label="Rarity" value={item.rarity} />
              <Row label="Price" value={`${item.price} ETH · ~$${item.priceUsd}`} />
            </div>

            <Link href="/marketplace" className={styles.collect}>Collect in the Vault →</Link>
            <CollectorTools assetId={item.id} name={item.name} />
            <p className={styles.note}>
              Collector note: the visual is generated from the object's deterministic seed and its declared reality basis, material, variant and rarity. Contract ownership is only represented after a verified on-chain transaction.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }) {
  return <div className={styles.row}><span>{label}</span><b>{value}</b></div>;
}

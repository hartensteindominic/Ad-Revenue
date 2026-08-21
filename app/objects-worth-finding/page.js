import ObjectsWorthFindingExperience from '../components/ObjectsWorthFindingExperience';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.voxelvault.io').replace(/\/$/, '');

export const metadata = {
  title: 'Objects Worth Finding · Voxel Vault',
  description: 'Discover real-world Voxel Vault objects and collect them with verified ownership.',
  alternates: { canonical: `${SITE_URL}/objects-worth-finding` },
  openGraph: {
    title: 'Objects Worth Finding · Voxel Vault',
    description: 'Walk, discover and collect real-world Voxel Vault objects with verified ownership.',
    url: `${SITE_URL}/objects-worth-finding`,
    type: 'website',
  },
};

export default function ObjectsWorthFindingPage() {
  return <ObjectsWorthFindingExperience />;
}

'use client';

import dynamic from 'next/dynamic';

const DiscoveryExperience = dynamic(() => import('../components/DiscoveryExperience'), { ssr: false });

export default function DiscoverPage() {
  return <DiscoveryExperience />;
}

'use client';

import VaultUniverse from './components/VaultUniverse';
import UniversalEnginePanel from './components/UniversalEnginePanel';
import SponsoredCollectibleShowcase from './components/SponsoredCollectibleShowcase';

export default function Home() {
  return (
    <>
      <UniversalEnginePanel />
      <VaultUniverse />
      <SponsoredCollectibleShowcase />
    </>
  );
}

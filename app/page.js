'use client';

import VaultUniverse from './components/VaultUniverse';
import UniversalEnginePanel from './components/UniversalEnginePanel';
import SponsoredCollectibles from './components/SponsoredCollectibles';

export default function Home() {
  return (
    <>
      <UniversalEnginePanel />
      <VaultUniverse />
      <SponsoredCollectibles />
    </>
  );
}

'use client';

import VaultUniverse from './components/VaultUniverse';
import UniversalEnginePanel from './components/UniversalEnginePanel';
import SponsoredCollectibles from './components/SponsoredCollectibles';
import ProximityDiscovery from './components/ProximityDiscovery';

export default function Home() {
  return (
    <>
      <UniversalEnginePanel />
      <VaultUniverse />
      <ProximityDiscovery />
      <SponsoredCollectibles />
    </>
  );
}

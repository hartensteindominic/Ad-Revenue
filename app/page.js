'use client';

import VaultFlowNav from './components/VaultFlowNav';
import VaultUniverse from './components/VaultUniverse';
import UniversalEnginePanel from './components/UniversalEnginePanel';

export default function Home() {
  return (
    <>
      <VaultFlowNav />
      <UniversalEnginePanel />
      <VaultUniverse />
    </>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const TapToTrade = dynamic(() => import('../components/TapToTrade'), { ssr: false });

function TradeInner() {
  const params = useSearchParams();
  const offerId = params.get('offer') || '';
  const mode = params.get('mode') || 'create';
  return <TapToTrade initialOfferId={offerId} mode={mode} />;
}

export default function TradePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#05060b', color: '#fff', display: 'grid', placeItems: 'center' }}>Loading trade…</div>}>
      <TradeInner />
    </Suspense>
  );
}

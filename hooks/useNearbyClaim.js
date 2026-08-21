'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClaimIntent } from '@/lib/collect/claimPolicy';

export function useNearbyClaim({ drop, wallet, enabled = true } = {}) {
  const [position, setPosition] = useState(null);
  const [permission, setPermission] = useState('unknown');

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => { setPermission('granted'); setPosition({ lat: coords.latitude, lng: coords.longitude }); },
      () => setPermission('denied'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  const intent = useMemo(() => createClaimIntent({
    dropId: drop?.id,
    wallet,
    userLocation: position,
    dropLocation: drop?.location,
  }), [drop?.id, drop?.location?.lat, drop?.location?.lng, wallet, position?.lat, position?.lng]);

  return { position, permission, intent, nearby: Boolean(intent.eligible), requestLocation: () => navigator.geolocation?.getCurrentPosition(() => {}, () => {}) };
}

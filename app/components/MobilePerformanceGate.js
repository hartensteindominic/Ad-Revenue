'use client';

import React, { useEffect, useState } from 'react';

export default function MobilePerformanceGate({ children, fallback = null, deferMs = 0 }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer;
    const run = () => setReady(true);
    if (typeof window === 'undefined') return undefined;

    // Let the first meaningful paint win before mounting another heavy surface.
    if (deferMs > 0) timer = window.setTimeout(run, deferMs);
    else if ('requestIdleCallback' in window) timer = window.requestIdleCallback(run, { timeout: 900 });
    else timer = window.setTimeout(run, 120);

    return () => {
      if (timer) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(timer);
        else window.clearTimeout(timer);
      }
    };
  }, [deferMs]);

  if (!ready) return fallback;
  return children;
}

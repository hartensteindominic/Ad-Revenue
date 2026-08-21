'use client';

import { useEffect, useRef, useState } from 'react';

let activePreviewCount = 0;
const MAX_ACTIVE_PREVIEWS = 3;
const waitingPreviews = [];

function releaseNext() {
  if (activePreviewCount >= MAX_ACTIVE_PREVIEWS || waitingPreviews.length === 0) return;
  const next = waitingPreviews.shift();
  if (next) next();
}

export default function Lazy3DPreview({ children, placeholder, rootMargin = '300px', minHeight = 180 }) {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    let cancelled = false;
    let observer;

    const activate = () => {
      if (cancelled || ready || queued) return;
      if (activePreviewCount < MAX_ACTIVE_PREVIEWS) {
        activePreviewCount += 1;
        setReady(true);
        return;
      }
      setQueued(true);
      waitingPreviews.push(() => {
        if (cancelled) return;
        activePreviewCount += 1;
        setReady(true);
        setQueued(false);
      });
    };

    if (typeof IntersectionObserver === 'undefined') activate();
    else {
      observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          activate();
          observer.disconnect();
        }
      }, { rootMargin });
      observer.observe(node);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      const index = waitingPreviews.indexOf(activate);
      if (index >= 0) waitingPreviews.splice(index, 1);
    };
  }, [rootMargin, ready, queued]);

  useEffect(() => {
    if (!ready) return undefined;
    return () => {
      activePreviewCount = Math.max(0, activePreviewCount - 1);
      releaseNext();
    };
  }, [ready]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight }}>
      {ready ? children : (placeholder || (
        <div aria-label="Loading 3D preview" style={{ width: '100%', height: '100%', minHeight, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 45%, rgba(126,94,255,.14), transparent 42%), #070912', color: '#8f95a8', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          {queued ? 'Ready next' : 'Loading 3D'}
        </div>
      ))}
    </div>
  );
}

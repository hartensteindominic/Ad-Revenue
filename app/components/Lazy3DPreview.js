'use client';

import { useEffect, useRef, useState } from 'react';

export default function Lazy3DPreview({ children, placeholder, rootMargin = '240px', minHeight = 180 }) {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight }}>
      {ready ? children : (placeholder || (
        <div aria-label="Loading 3D preview" style={{ width: '100%', height: '100%', minHeight, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 45%, rgba(126,94,255,.14), transparent 42%), #070912', color: '#8f95a8', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase' }}>
          Loading collectible…
        </div>
      ))}
    </div>
  );
}

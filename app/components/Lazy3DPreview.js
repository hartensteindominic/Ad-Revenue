'use client';

import { useEffect, useRef, useState } from 'react';

const waitingPreviews = [];
let activePreviewCount = 0;

function maxActivePreviews() {
  if (typeof window === 'undefined') return 2;
  const mobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
  return mobile ? 2 : 4;
}

function releaseNext() {
  const limit = maxActivePreviews();
  while (activePreviewCount < limit && waitingPreviews.length) {
    const next = waitingPreviews.shift();
    next?.();
  }
}

export default function Lazy3DPreview({ children, placeholder, rootMargin = '220px', minHeight = 180 }) {
  const hostRef = useRef(null);
  const queuedRef = useRef(null);
  const readyRef = useRef(false);
  const visibleRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    let cancelled = false;

    const activate = () => {
      if (cancelled || !visibleRef.current || readyRef.current || queuedRef.current) return;
      if (activePreviewCount < maxActivePreviews()) {
        activePreviewCount += 1;
        readyRef.current = true;
        setReady(true);
        return;
      }

      const request = () => {
        queuedRef.current = null;
        if (cancelled || !visibleRef.current || readyRef.current) return;
        activePreviewCount += 1;
        readyRef.current = true;
        setReady(true);
        setQueued(false);
      };
      queuedRef.current = request;
      setQueued(true);
      waitingPreviews.push(request);
    };

    const deactivate = (updateState = true) => {
      const request = queuedRef.current;
      if (request) {
        const index = waitingPreviews.indexOf(request);
        if (index >= 0) waitingPreviews.splice(index, 1);
        queuedRef.current = null;
        if (updateState) setQueued(false);
      }
      if (readyRef.current) {
        readyRef.current = false;
        activePreviewCount = Math.max(0, activePreviewCount - 1);
        if (updateState) setReady(false);
        releaseNext();
      }
    };

    let observer;
    if (typeof IntersectionObserver === 'undefined') {
      visibleRef.current = true;
      activate();
    } else {
      observer = new IntersectionObserver(([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
        if (visibleRef.current) {
          activate();
        } else {
          deactivate();
        }
      }, { rootMargin, threshold: 0.01 });
      observer.observe(node);
    }

    return () => {
      cancelled = true;
      visibleRef.current = false;
      observer?.disconnect();
      deactivate(false);
    };
  }, [rootMargin]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight }}>
      {ready ? children : (placeholder || (
        <div aria-label="Loading 3D preview" style={{ width: '100%', height: '100%', minHeight, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 45%, rgba(126,94,255,.14), transparent 42%), #070912', color: '#8f95a8', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {queued ? 'Next' : '3D'}
        </div>
      ))}
    </div>
  );
}

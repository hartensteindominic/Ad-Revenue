'use client';

import { useEffect } from 'react';
import { tapHaptic } from '../../lib/native';

export default function NativeEnhancements() {
  useEffect(() => {
    const onClick = (event) => {
      const target = event.target?.closest?.('button, a');
      if (!target || target.hasAttribute('disabled')) return;
      void tapHaptic();
    };

    document.addEventListener('click', onClick, { passive: true });
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}

'use client';

import React, { useEffect, useState } from 'react';
import { get3DCapabilities } from '@/app/3d-runtime-check';

export default function ThreeDStatus() {
  const [cap, setCap] = useState(null);
  useEffect(() => setCap(get3DCapabilities()), []);
  if (!cap || cap.webgl) return null;
  return <div role="status" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">3D preview isn’t available on this device, so Voxel Vault is showing a lightweight preview instead.</div>;
}

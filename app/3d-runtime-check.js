export function get3DCapabilities() {
  if (typeof document === 'undefined') return { webgl: null, webgl2: null };
  const canvas = document.createElement('canvas');
  let webgl = false;
  let webgl2 = false;
  try { webgl2 = Boolean(canvas.getContext('webgl2')); } catch {}
  try { webgl = Boolean(canvas.getContext('webgl')); } catch {}
  return { webgl, webgl2 };
}

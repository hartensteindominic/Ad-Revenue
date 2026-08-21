# 3D runtime hardening

- Interactive viewer is browser-only via dynamic import.
- Loading state is shown before Three.js mounts.
- WebGL capability is checked client-side.
- Viewer failures fall back to ArtPreview.
- External 3D URLs are validated by `lib/3d-asset-guard.js` before use.
- Do not force WebGL context loss during component cleanup on mobile.
- A missing/broken model must never blank the gallery.
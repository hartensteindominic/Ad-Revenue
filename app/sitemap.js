import { CATALOG_SIZE } from '../lib/catalog';

export default function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app').replace(/\/$/, '');
  const now = new Date();

  const routes = ['/', '/marketplace'];
  const catalogRoutes = Array.from({ length: Math.min(CATALOG_SIZE, 1000) }, (_, index) => `/asset/${index + 1}`);

  return [...routes, ...catalogRoutes].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/marketplace' ? 0.9 : 0.6,
  }));
}

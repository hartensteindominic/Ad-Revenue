export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://voxel-vault.vercel.app';
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
    host: base,
  };
}

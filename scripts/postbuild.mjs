#!/usr/bin/env node
// Completes the static output for Cloudflare Pages: 404.html (served with status 404 for any
// unknown path), sitemap.xml and robots.txt for the indexable views.
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'dist/exeris-web/browser');
export const SITE_URL = 'https://exeris.eu';

/** Route paths of the indexable views, as the generator derives them. */
export function indexableRoutes() {
  const seo = JSON.parse(readFileSync(join(ROOT, 'content/meta/seo.json'), 'utf8'));
  return readdirSync(join(ROOT, 'content/views'))
    .filter((f) => f.startsWith('view_') && f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(ROOT, 'content/views', f), 'utf8')).view)
    .filter((v) => seo[v.name]?.index !== false)
    .map((v) => (v.route ?? v.name).replace(/^\/+/, ''))
    .sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  copyFileSync(join(OUT, '404/index.html'), join(OUT, '404.html'));
  const urls = indexableRoutes().map((r) => `  <url><loc>${SITE_URL}/${r}</loc></url>`);
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`postbuild: 404.html, sitemap.xml (${urls.length} URLs), robots.txt`);
}

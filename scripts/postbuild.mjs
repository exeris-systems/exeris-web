#!/usr/bin/env node
// Completes the static output of one application (site by default, or docs) for Cloudflare:
// 404.html (served with status 404 for any unknown path), sitemap.xml and robots.txt for its
// indexable routes; for the docs, refs.json with the commits the sources were read at.
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

/**
 * Routes of the docs, from the index scripts/docs/fetch-docs.mjs writes: the home page, each
 * document and each section's page list.
 */
export function docsRoutes() {
  const index = docsIndex();
  const sections = index.sections.filter((s) => index.pages.some((p) => p.section === s.id));
  return ['', ...index.pages.map((p) => p.route), ...sections.map((s) => `browse/${s.id}`)];
}

function docsIndex() {
  return JSON.parse(readFileSync(join(ROOT, 'projects/docs/src/app/generated/index.json'), 'utf8'));
}

/**
 * Each application: its output directory, its public URL, its indexable routes and the files
 * postbuild adds beyond 404.html, the sitemap and robots.txt. An application with no route list
 * yet gets no sitemap and is held to the shared checks only.
 */
export const APPS = {
  site: { out: OUT, url: SITE_URL, routes: indexableRoutes, redirects: true },
  docs: { out: join(ROOT, 'dist/docs/browser'), url: 'https://docs.exeris.eu', routes: docsRoutes, files: ['refs.json'] },
  lab: { out: join(ROOT, 'dist/lab/browser'), url: 'https://lab.exeris.eu', routes: null },
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2] ?? 'site';
  const app = APPS[name];
  if (!app?.routes) throw new Error(`postbuild: ${name} has no routes`);
  const { out, url } = app;
  copyFileSync(join(out, '404/index.html'), join(out, '404.html'));
  const urls = app.routes().map((r) => `  <url><loc>${url}/${r}</loc></url>`);
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);
  const files = ['404.html', `sitemap.xml (${urls.length} URLs)`, 'robots.txt'];
  if (name === 'docs') {
    // The commit each source was read at, which scripts/docs/refresh.mjs compares with the sources'
    // refs now to decide whether the live docs need a rebuild.
    writeFileSync(join(out, 'refs.json'), `${JSON.stringify(docsIndex().refs)}\n`);
    files.push('refs.json');
  }
  const label = name === 'site' ? 'postbuild' : `postbuild ${name}`;
  console.log(`${label}: ${files.join(', ')}`);
}

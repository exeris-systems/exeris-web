#!/usr/bin/env node
// Builds the command-palette index (src/data/search-index.json) from the authored views, the
// SEO descriptions, the cap registry, the SKU table and the concept list. Regenerated before
// every build, so it is never stale and never committed. It also writes src/data/view-routes.json,
// the route path of each view, which the SEO title strategy keys the page tags on: the generated
// routes carry the view's title, not its name.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

/** Where a document entry of the palette opens: the docs site, by its host, or else GitHub. */
export function docHint(href) {
  return new URL(href).host === 'docs.exeris.eu' ? 'Docs' : 'GitHub';
}

export function buildIndex() {
  const seo = read('content/meta/seo.json');
  const extra = read('content/meta/index-extra.json');
  const caps = read('src/data/caps.json');
  const skus = read('src/data/skus.json');

  const pages = readdirSync(join(ROOT, 'content/views'))
    .filter((f) => f.startsWith('view_') && f.endsWith('.json'))
    .map((f) => read(`content/views/${f}`).view)
    .filter((v) => seo[v.name]?.index !== false)
    .map((v) => {
      const path = `/${(v.route ?? v.name).replace(/^\/+/, '')}`;
      return { kind: 'page', title: seo[v.name]?.title ?? v.title ?? v.name, href: path, hint: path === '/' ? 'Home' : path, keywords: seo[v.name]?.description ?? '' };
    })
    .sort((a, b) => (a.href === '/' ? -1 : b.href === '/' ? 1 : a.href.localeCompare(b.href)));

  const skuEntries = skus.skus.map((s) => ({
    kind: 'sku',
    title: s.name,
    href: s.repo ? `/skus#sku-${s.id}` : '/skus',
    hint: s.family,
    keywords: s.caps.join(' '),
  }));

  const capEntries = caps.caps.map((c) => ({
    kind: 'capability',
    title: c.short,
    href: `/capabilities#cap-${c.short}`,
    hint: `L${c.layer} · ${c.licence}`,
    keywords: `${c.name} ${c.layerName}`,
  }));

  const concepts = extra.concepts.map((c) => ({ kind: 'concept', ...c }));
  const docs = extra.docs.map((d) => ({ kind: 'doc', hint: docHint(d.href), ...d }));
  return [...pages, ...skuEntries, ...concepts, ...docs, ...capEntries];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const index = buildIndex();
  writeFileSync(join(ROOT, 'src/data/search-index.json'), `${JSON.stringify(index, null, 2)}\n`);
  const routes = Object.fromEntries(
    readdirSync(join(ROOT, 'content/views'))
      .filter((f) => f.startsWith('view_') && f.endsWith('.json'))
      .map((f) => read(`content/views/${f}`).view)
      .map((v) => [(v.route ?? v.name).replace(/^\/+/, ''), v.name])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(join(ROOT, 'src/data/view-routes.json'), `${JSON.stringify(routes, null, 2)}\n`);
  console.log(`build-index: ${index.length} entries, ${Object.keys(routes).length} view routes`);
}

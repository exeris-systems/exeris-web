#!/usr/bin/env node
// Verifies the static output: every route emitted its own HTML with title, description,
// canonical and Open Graph tags; the page markup leaves no unresolved content token; and the
// site makes no third-party request and runs no inline script (the no-tracking check).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUT, SITE_URL, indexableRoutes } from './postbuild.mjs';

const REQUIRED = [
  [/<title>[^<]{3,}<\/title>/, '<title>'],
  [/<meta name="description" content="[^"]{20,}"/, 'meta description'],
  [/<link rel="canonical" href="https:\/\/exeris\.eu\/[^"]*"/, 'canonical'],
  [/<meta property="og:title" content="[^"]+"/, 'og:title'],
  [/<meta property="og:description" content="[^"]+"/, 'og:description'],
  [/<meta property="og:url" content="https:\/\/exeris\.eu\/[^"]*"/, 'og:url'],
  [/<meta property="og:image" content="https:\/\/exeris\.eu\/[^"]+"/, 'og:image'],
  [/<meta name="twitter:card"/, 'twitter:card'],
  [/<h1[\s>]/, 'an h1'],
];

/** Hosts a page may name in an attribute that triggers a request. */
const SELF = new Set(['exeris.eu']);
const TRACKERS = /google-analytics|googletagmanager|gtag\(|doubleclick|facebook\.net|plausible|hotjar|segment\.(io|com)|clarity\.ms|fonts\.googleapis|fonts\.gstatic|cloudflareinsights/i;

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

export function verify() {
  const errors = [];
  const routes = [...indexableRoutes(), '404'];
  const seenTitles = new Map();
  for (const route of routes) {
    const file = join(OUT, route, 'index.html');
    if (!existsSync(file)) {
      errors.push(`missing ${relative(OUT, file)}`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    for (const [re, what] of REQUIRED) if (!re.test(html)) errors.push(`/${route}: no ${what}`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (route !== '404' && canonical !== `${SITE_URL}/${route}`) errors.push(`/${route}: canonical is ${canonical}`);
    if (route === '404' && !/<meta name="robots" content="noindex"/.test(html)) errors.push('/404: not noindex');
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    if (seenTitles.has(title)) errors.push(`/${route}: same title as /${seenTitles.get(title)}`);
    seenTitles.set(title, route);
    const body = html.replace(/<script id="ng-state"[\s\S]*?<\/script>/, '');
    const token = body.match(/\{(caps|skus|layers|licences|sku)[a-z.:-]*\}/);
    if (token) errors.push(`/${route}: unresolved content token ${token[0]}`);
  }
  for (const extra of ['404.html', 'sitemap.xml', 'robots.txt', '_headers', '_redirects']) {
    if (!existsSync(join(OUT, extra))) errors.push(`missing ${extra}`);
  }

  // No-tracking: no third-party request, no tracker, no inline executable script, no cookie write.
  for (const file of files(OUT)) {
    const rel = relative(OUT, file);
    if (!/\.(html|js|css|webmanifest)$/.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    if (TRACKERS.test(text)) errors.push(`${rel}: names a tracker or a third-party font host`);
    if (/\.js$/.test(file) && /document\.cookie\s*=(?!=)/.test(text)) errors.push(`${rel}: sets a cookie`);
    if (/\.css$/.test(file)) {
      for (const m of text.matchAll(/url\(\s*["']?(https?:)?\/\/([^/"')]+)/g)) if (!SELF.has(m[2])) errors.push(`${rel}: CSS loads from ${m[2]}`);
      for (const m of text.matchAll(/@import\s+(url\()?["']?https?:/g)) errors.push(`${rel}: CSS @import from another origin (${m[0]})`);
    }
    if (/\.html$/.test(file)) {
      for (const m of text.matchAll(/<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)="(https?:)?\/\/([^/"]+)/g)) {
        const isNavigation = m[1] === 'link' && /rel="canonical"/.test(m[0]);
        if (!SELF.has(m[4]) && !isNavigation) errors.push(`${rel}: <${m[1]}> loads from ${m[4]}`);
      }
      for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        const attrs = m[1];
        const inline = !/\bsrc=/.test(attrs) && m[2].trim();
        const data = /type="application\/(json|ld\+json)"/.test(attrs);
        if (inline && !data) errors.push(`${rel}: inline script (blocked by script-src 'self')`);
      }
      if (/\son[a-z]+="/.test(text.replace(/content="[^"]*"/g, ''))) errors.push(`${rel}: inline event handler`);
    }
  }
  return { errors, routes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, routes } = verify();
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`verify-dist: ${errors.length} problem(s)`);
    process.exit(1);
  }
  console.log(`verify-dist: ok (${routes.length} routes with SEO tags; no third-party requests, no inline scripts)`);
}

#!/usr/bin/env node
// Verifies the static output of one application (site, docs or lab; site by default): every
// route emitted its own HTML with title, description, canonical and Open Graph tags; the page
// markup leaves no unresolved content token; and the application makes no third-party request
// and runs no inline script (the no-tracking check). The route and SEO checks cover an
// application with a route list (APPS in postbuild.mjs); one without it is held to the shared
// headers and the no-tracking check.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS } from './postbuild.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The tags every prerendered page of an application served at `url` must carry. */
function required(url) {
  const at = url.replace(/[.]/g, '\\.').replace(/\//g, '\\/');
  return [
    [/<title>[^<]{3,}<\/title>/, '<title>'],
    [/<meta name="description" content="[^"]{20,}"/, 'meta description'],
    [new RegExp(`<link rel="canonical" href="${at}\\/[^"]*"`), 'canonical'],
    [/<meta property="og:title" content="[^"]+"/, 'og:title'],
    [/<meta property="og:description" content="[^"]+"/, 'og:description'],
    [new RegExp(`<meta property="og:url" content="${at}\\/[^"]*"`), 'og:url'],
    [new RegExp(`<meta property="og:image" content="${at}\\/[^"]+"`), 'og:image'],
    [/<meta name="twitter:card"/, 'twitter:card'],
    [/<h1[\s>]/, 'an h1'],
  ];
}

const TRACKERS = /google-analytics|googletagmanager|gtag\(|doubleclick|facebook\.net|plausible\.io|hotjar|segment\.(io|com)|clarity\.ms|fonts\.googleapis|fonts\.gstatic|cloudflareinsights/i;

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

export function verify(app = 'site') {
  const config = APPS[app];
  if (!config) return { errors: [`unknown application ${app}`], routes: [] };
  const { out, url } = config;
  const errors = [];
  if (!existsSync(out)) return { errors: [`missing ${relative(ROOT, out)}; build ${app} first`], routes: [] };
  const routes = config.routes ? [...config.routes(), '404'] : [];
  errors.push(...routeErrors(config, routes));
  if (!existsSync(join(out, '_headers'))) errors.push('missing _headers');
  errors.push(...noTrackingErrors(out, new Set([new URL(url).hostname])));
  return { errors, routes };
}

/** Route, SEO and token checks of an application's prerendered pages. */
function routeErrors({ out, url, redirects }, routes) {
  const errors = [];
  const seenTitles = new Map();
  const REQUIRED = required(url);
  for (const route of routes) {
    const file = join(out, route, 'index.html');
    if (!existsSync(file)) {
      errors.push(`missing ${relative(out, file)}`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    for (const [re, what] of REQUIRED) if (!re.test(html)) errors.push(`/${route}: no ${what}`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (route !== '404' && canonical !== `${url}/${route}`) errors.push(`/${route}: canonical is ${canonical}`);
    if (route === '404' && !/<meta name="robots" content="noindex"/.test(html)) errors.push('/404: not noindex');
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    if (seenTitles.has(title)) errors.push(`/${route}: same title as /${seenTitles.get(title)}`);
    seenTitles.set(title, route);
    const body = html.replace(/<script id="ng-state"[\s\S]*?<\/script>/, '');
    const token = body.match(/\{(caps|skus|layers|licences|sku)[a-z.:-]*\}/);
    if (token) errors.push(`/${route}: unresolved content token ${token[0]}`);
  }
  if (routes.length) {
    for (const extra of ['404.html', 'sitemap.xml', 'robots.txt', ...(redirects ? ['_redirects'] : [])]) {
      if (!existsSync(join(out, extra))) errors.push(`missing ${extra}`);
    }
  }
  return errors;
}

/** No third-party request, no tracker, no inline executable script, no cookie write. */
export function noTrackingErrors(out, self) {
  const errors = [];
  for (const file of files(out)) {
    const rel = relative(out, file);
    if (!/\.(html|js|css|webmanifest)$/.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    if (TRACKERS.test(text)) errors.push(`${rel}: names a tracker or a third-party font host`);
    if (/\.js$/.test(file) && /document\.cookie\s*=(?!=)/.test(text)) errors.push(`${rel}: sets a cookie`);
    if (/\.css$/.test(file)) {
      for (const m of text.matchAll(/url\(\s*["']?(https?:)?\/\/([^/"')]+)/g)) if (!self.has(m[2])) errors.push(`${rel}: CSS loads from ${m[2]}`);
      for (const m of text.matchAll(/@import\s+(url\()?["']?https?:/g)) errors.push(`${rel}: CSS @import from another origin (${m[0]})`);
    }
    if (/\.html$/.test(file)) {
      for (const m of text.matchAll(/<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)="(https?:)?\/\/([^/"]+)/g)) {
        const isNavigation = m[1] === 'link' && /rel="canonical"/.test(m[0]);
        if (!self.has(m[4]) && !isNavigation) errors.push(`${rel}: <${m[1]}> loads from ${m[4]}`);
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
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = process.argv[2] ?? 'site';
  const { errors, routes } = verify(app);
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`verify-dist ${app}: ${errors.length} problem(s)`);
    process.exit(1);
  }
  const seo = routes.length ? `${routes.length} routes with SEO tags; ` : '';
  console.log(`verify-dist${app === 'site' ? '' : ` ${app}`}: ok (${seo}no third-party requests, no inline scripts)`);
}

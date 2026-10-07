#!/usr/bin/env node
// A static file server for the build output that answers the way Cloudflare Pages does for this
// site: `/path` serves `path/index.html`, an unknown path serves `404.html` with status 404, and
// the `_headers` rules apply, and text is compressed as Pages compresses it (Brotli, else gzip).
// Used by Lighthouse CI and for local review; never deployed.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const root = process.argv[2] ?? 'dist/exeris-web/browser';
const port = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

/** `_headers` rules as [pattern, headers]; `*` in a pattern matches any run of characters. */
function loadHeaders() {
  const file = join(root, '_headers');
  if (!existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { re: new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`), headers: {} };
      rules.push(current);
    } else if (current) {
      const i = line.indexOf(':');
      current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}
const rules = loadHeaders();

function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, clean), join(root, clean, 'index.html'), join(root, `${clean}.html`)];
  return candidates.find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
}

createServer((req, res) => {
  const path = req.url ?? '/';
  let file = resolve(path);
  let status = 200;
  if (!file) {
    file = join(root, '404.html');
    status = 404;
  }
  const headers = { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' };
  for (const rule of rules) if (rule.re.test(path.split('?')[0])) Object.assign(headers, rule.headers);
  let body = readFileSync(file);
  const accept = String(req.headers['accept-encoding'] ?? '');
  if (/^(text|application\/(json|manifest|xml)|image\/svg)/.test(headers['Content-Type']) || /javascript/.test(headers['Content-Type'])) {
    if (/\bbr\b/.test(accept)) {
      body = brotliCompressSync(body);
      headers['Content-Encoding'] = 'br';
    } else if (/\bgzip\b/.test(accept)) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    headers['Vary'] = 'Accept-Encoding';
  }
  res.writeHead(status, headers);
  res.end(body);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));

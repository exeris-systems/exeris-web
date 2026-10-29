import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { linkErrors, noTrackingErrors, routeErrors, verify } from '../scripts/verify-dist.mjs';

function out(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'verify-dist-'));
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

describe('the no-tracking check of an application', () => {
  it('accepts a page that loads only from its own host', () => {
    const dir = out({ 'index.html': '<link rel="stylesheet" href="/styles.css"><img src="https://docs.exeris.eu/a.png">' });
    expect(noTrackingErrors(dir, new Set(['docs.exeris.eu']))).toEqual([]);
  });

  it('rejects a load from another host, the site included, and an inline script', () => {
    const dir = out({ 'index.html': '<img src="https://exeris.eu/a.png"><script>x()</script>' });
    const errors = noTrackingErrors(dir, new Set(['docs.exeris.eu']));
    expect(errors).toEqual([expect.stringMatching(/<img> loads from exeris\.eu/), expect.stringMatching(/inline script/)]);
  });

  it('names an unknown application', () => {
    expect(verify('blog').errors).toEqual(['unknown application blog']);
  });

  it('rejects the analytics host and accepts the English word', () => {
    const dir = out({
      'a/index.html': '<script src="/x.js" data-domain="docs.exeris.eu" defer></script><p>loads plausible.io/js/script.js</p>',
      'b/index.html': '<p>a sign error yields a plausible string</p>',
    });
    const errors = noTrackingErrors(dir, new Set(['docs.exeris.eu']));
    expect(errors).toEqual([expect.stringMatching(/^a\/index\.html: names a tracker/)]);
  });
});

describe('the route check of an application', () => {
  const page = (canonical: string) =>
    `<title>Page — Exeris Docs</title><meta name="description" content="A description of twenty characters or more">` +
    `<link rel="canonical" href="${canonical}"><meta property="og:title" content="t"><meta property="og:description" content="d">` +
    `<meta property="og:url" content="${canonical}"><meta property="og:image" content="https://docs.exeris.eu/a.png"><meta name="twitter:card" content="x"><h1>T</h1>`;

  it('accepts a page whose canonical is its own address on the application host', () => {
    const dir = out({ 'kernel/a/index.html': page('https://docs.exeris.eu/kernel/a'), '404.html': '', 'sitemap.xml': '', 'robots.txt': '' });
    expect(routeErrors({ out: dir, url: 'https://docs.exeris.eu' }, ['kernel/a'])).toEqual([]);
  });

  it('flags a canonical on another host', () => {
    const dir = out({ 'kernel/a/index.html': page('https://exeris.eu/kernel/a') });
    const errors = routeErrors({ out: dir, url: 'https://docs.exeris.eu' }, ['kernel/a']);
    expect(errors).toEqual(expect.arrayContaining([expect.stringMatching(/no canonical/), expect.stringMatching(/canonical is https:\/\/exeris\.eu\/kernel\/a/)]));
  });
});

describe('the link check of an application', () => {
  const dir = out({
    'index.html': '<a href="/kernel/a">a</a><a href="/og.png">image</a><a href="https://exeris.eu/x">site</a><a href="//cdn.test/x">cdn</a>',
    'kernel/a/index.html': '<h2 id="contract">Contract</h2><a href="#contract">here</a><a href="/kernel/b#hot-path">b</a><a href="/">home</a>',
    'kernel/b/index.html': '<h2 id="hot-path">Hot path</h2><a href="/kernel/a/">a</a>',
    'og.png': '',
  });

  it('accepts links to routes, files of the output and anchors that exist', () => {
    expect(linkErrors(dir, ['', 'kernel/a', 'kernel/b'])).toEqual([]);
  });

  it('rejects a link to a missing route and an anchor missing from its page', () => {
    const broken = out({
      'index.html': '<a href="/kernel/gone">x</a><a href="/kernel/gone">again</a><a href="/kernel/a#nope">y</a><a href="#top">z</a>',
      'kernel/a/index.html': '<h2 id="contract">Contract</h2>',
    });
    expect(linkErrors(broken, ['', 'kernel/a'])).toEqual([
      '/: link /kernel/gone: no such route',
      '/: link /kernel/a#nope: no element #nope on /kernel/a',
      '/: link #top: no element #top on /',
    ]);
  });
});

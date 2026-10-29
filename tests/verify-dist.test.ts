import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { noTrackingErrors, verify } from '../scripts/verify-dist.mjs';

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
});

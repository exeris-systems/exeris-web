import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '..', 'content/views');
const views = readdirSync(DIR)
  .filter((f) => f.startsWith('view_'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));

describe('views', () => {
  it('cover exactly the routes of the site spec', () => {
    const routes = views.map((v) => (v.view.route ?? v.view.name).replace(/^\/+/, '')).sort();
    expect(routes).toEqual(
      ['', '404', 'ai', 'capabilities', 'lab', 'platform', 'pricing', 'skus', 'spring', 'start'].sort(),
    );
  });

  it('name each file after its view', () => {
    for (const v of views) {
      expect(v.name).toBe(v.view.name);
      expect(v.qualifiedName.startsWith(`${v.packageName}.`)).toBe(true);
    }
  });
});

describe('the documentation address', () => {
  it('is docs.exeris.eu: /docs and every path under it redirect there', () => {
    const redirects = readFileSync(join(__dirname, '../public/_redirects'), 'utf8');
    expect(redirects).toMatch(/^\/docs\s+https:\/\/docs\.exeris\.eu\s+301$/m);
    expect(redirects).toMatch(/^\/docs\/\*\s+https:\/\/docs\.exeris\.eu\s+301$/m);
  });
});

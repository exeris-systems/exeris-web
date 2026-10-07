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
      ['', '404', 'ai', 'capabilities', 'docs', 'lab', 'platform', 'pricing', 'skus', 'skus/api-gateway', 'skus/bot-blocker', 'skus/idp', 'spring'].sort(),
    );
  });

  it('name each file after its view', () => {
    for (const v of views) {
      expect(v.name).toBe(v.view.name);
      expect(v.qualifiedName.startsWith(`${v.packageName}.`)).toBe(true);
    }
  });
});

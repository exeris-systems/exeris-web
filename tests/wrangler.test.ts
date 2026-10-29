import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const angular = JSON.parse(readFileSync(join(ROOT, 'angular.json'), 'utf8'));

describe('the Cloudflare configuration', () => {
  it('serves the directory the site builds into', () => {
    const outputPath = Object.values(angular.projects as Record<string, { architect: { build: { options: { outputPath: string } } } }>)[0]
      .architect.build.options.outputPath;
    expect(config.assets.directory).toBe(`./${outputPath}/browser`);
  });

  it('answers at the canonical address, with 404.html for an unknown path, and allows previews', () => {
    expect(config.assets.html_handling).toBe('drop-trailing-slash');
    expect(config.assets.not_found_handling).toBe('404-page');
    expect(config.previews).toEqual({});
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');
const jsonc = (path: string) => JSON.parse(readFileSync(join(ROOT, path), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const config = jsonc('wrangler.jsonc');
const docs = jsonc('projects/docs/wrangler.jsonc');
const angular = JSON.parse(readFileSync(join(ROOT, 'angular.json'), 'utf8'));

describe('the Cloudflare configuration', () => {
  it('serves the directory the site builds into', () => {
    const outputPath = angular.projects['exeris-web'].architect.build.options.outputPath;
    expect(config.assets.directory).toBe(`./${outputPath}/browser`);
  });

  it('answers at the canonical address, with 404.html for an unknown path, and allows previews', () => {
    expect(config.assets.html_handling).toBe('drop-trailing-slash');
    expect(config.assets.not_found_handling).toBe('404-page');
    expect(config.previews).toEqual({});
  });

  it('serves the docs build from the docs configuration, the same way', () => {
    const outputPath = angular.projects.docs.architect.build.options.outputPath;
    expect(docs.assets.directory).toBe(`../../${outputPath}/browser`);
    expect(docs.assets.html_handling).toBe('drop-trailing-slash');
    expect(docs.assets.not_found_handling).toBe('404-page');
    expect(docs.previews).toEqual({});
  });
});

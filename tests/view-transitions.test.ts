import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');

describe('view transitions', () => {
  it.each(['src/app/app.config.ts', 'projects/docs/src/app/app.config.ts'])('are registered with the router of %s', (file) => {
    expect(read(file)).toMatch(/provideRouter\([\s\S]*withViewTransitions\(\{ skipInitialTransition: true \}\)[\s\S]*\)/);
  });

  it('cross documents, keep the navigation bar still and stop under reduced motion', () => {
    const css = read('projects/shell/styles/shell.css');
    expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto;\s*\}/);
    expect(css).toMatch(/\.ex-nav\s*\{[^}]*view-transition-name:\s*ex-nav;/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*::view-transition-group\(\*\),\s*::view-transition-old\(\*\),\s*::view-transition-new\(\*\)\s*\{\s*animation: none !important;/);
  });
});

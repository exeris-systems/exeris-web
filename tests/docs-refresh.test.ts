import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { staleSources } from '../scripts/docs/refresh.mjs';

describe('staleSources', () => {
  const sources = { kernel: { repo: 'exeris-kernel' }, sdk: { repo: 'exeris-sdk' } };
  const a = 'a'.repeat(40);
  const b = 'b'.repeat(40);
  const c = 'c'.repeat(40);
  const changed = (files: Record<string, string[] | null>) => async (repo: string) => files[repo];

  it('finds nothing to rebuild when every source is at the commit the site was built from', async () => {
    expect(await staleSources(sources, { kernel: a, sdk: b }, { kernel: a, sdk: b }, changed({}))).toEqual([]);
  });

  it('rebuilds for a changed Markdown file and not for a change of code only', async () => {
    const files = { 'exeris-kernel': ['src/Main.java', 'docs/guides/01.md'], 'exeris-sdk': ['pom.xml'] };
    expect(await staleSources(sources, { kernel: a, sdk: b }, { kernel: c, sdk: c }, changed(files))).toEqual([
      'kernel: 1 Markdown file(s) changed, docs/guides/01.md first',
    ]);
  });

  it('rebuilds when the live site has no refs, misses a source, or a change cannot be compared or is too long to list', async () => {
    expect(await staleSources(sources, null, { kernel: a, sdk: b }, changed({}))).toEqual(['the live site names no source commits']);
    expect(await staleSources(sources, { kernel: a }, { kernel: a, sdk: b }, changed({}))).toEqual(['sdk: not in the live site']);
    expect(await staleSources(sources, { kernel: a, sdk: b }, { kernel: c, sdk: b }, changed({ 'exeris-kernel': null }))).toEqual([
      'kernel: aaaaaaa..ccccccc cannot be compared',
    ]);
    const many = Array.from({ length: 300 }, (_, i) => `src/F${i}.java`);
    expect(await staleSources(sources, { kernel: a, sdk: b }, { kernel: c, sdk: b }, changed({ 'exeris-kernel': many }))).toEqual([
      'kernel: 300 or more files changed',
    ]);
  });
});

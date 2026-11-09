import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { staleData } from '../scripts/refresh-site.mjs';

describe('staleData', () => {
  it('rebuilds when the digest differs or the live site has none, and not when it matches', () => {
    expect(staleData('abc', 'abc')).toBeNull();
    expect(staleData('abc', 'def')).toMatch(/differs/);
    expect(staleData(null, 'def')).toMatch(/publishes no data digest/);
  });
});

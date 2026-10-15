import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { checkContent, skuRepoErrors, strayNumbers } from '../scripts/check-content.mjs';

describe('content gate', () => {
  it('passes on the committed content', () => {
    const { errors } = checkContent();
    expect(errors).toEqual([]);
  });

  it('flags the prototype figures the spec bans', () => {
    for (const banned of [
      '~60% CPU waste',
      '> 160 GB on a 4 GB payload',
      '40× less',
      '+2–4× nodes',
      '11.4M ops/s',
      'T+12ms',
      'TCK 12/12',
      'v0.5.0-SNAPSHOT',
      '€0.04 / vCPU·h',
      '>50k RPS/node',
      'Sub-1% CPU overhead',
    ]) {
      expect(strayNumbers(banned), banned).not.toEqual([]);
    }
  });

  it('lets structural names through', () => {
    for (const ok of ['Java 25 LTS or newer', 'HTTP/1.1 and HTTP/2', 'Tier 2', 'Layer 6 caps', 'ADR-023', 'TRL-3 (PLATFORM)', 'Apache-2.0', 'B2B', '`i18n`', '/platform#tier-1']) {
      expect(strayNumbers(ok), ok).toEqual([]);
    }
  });

  it('fails when a quoted claim string changes upstream', () => {
    const { used } = checkContent();
    const lock = Object.fromEntries(used.map((k: string) => [k, 'stale']));
    const { errors } = checkContent({ lock });
    expect(errors.length).toBe(used.length);
    expect(errors[0]).toMatch(/changed upstream/);
  });

  describe('SKUs with a repository', () => {
    const skus = [{ id: 'a' }, { id: 'b' }];
    const view = (ids: string[]) => ({
      file: 'view_x.json',
      json: { view: { regions: [{ components: [{ type: 'CUSTOM', customType: 'ExSkuCards', props: JSON.stringify({ skus: ids.map((id) => ({ id })) }) }] }] } },
    });

    it('accepts listed ids that the registry holds', () => {
      expect(skuRepoErrors({ repos: ['a'], skus, views: [view(['a'])] })).toEqual([]);
    });

    it('fails on a listed id the registry lacks', () => {
      expect(skuRepoErrors({ repos: ['a', 'z'], skus, views: [] })).toEqual([expect.stringMatching(/"z" is not a SKU of the registry/)]);
    });

    it('fails on a card for an id the list does not name', () => {
      expect(skuRepoErrors({ repos: ['a'], skus, views: [view(['a', 'b'])] })).toEqual([expect.stringMatching(/card for "b"/)]);
    });
  });
});

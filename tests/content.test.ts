import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { checkContent, propsNumberErrors, repoSummaryErrors, skuCardErrors, strayNumbers } from '../scripts/check-content.mjs';

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

  it('checks the strings of an items list for numbers', () => {
    const tier = { tiers: [{ items: ['Kernel SPI and Core', '40× faster driver'] }, { items: 'skus' }] };
    const errors = propsNumberErrors(tier, 'f');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('props.tiers[0].items[1]: numeric literal "40"');
  });

  it('fails when a quoted claim string changes upstream', () => {
    const { used } = checkContent();
    const lock = Object.fromEntries(used.map((k: string) => [k, 'stale']));
    const { errors } = checkContent({ lock });
    expect(errors.length).toBe(used.length);
    expect(errors[0]).toMatch(/changed upstream/);
  });

  describe('SKU cards', () => {
    const skus = [{ id: 'a', repo: { url: 'u' } }, { id: 'b', repo: null }];
    const view = (ids: string[]) => ({
      file: 'view_x.json',
      json: { view: { regions: [{ components: [{ type: 'CUSTOM', customType: 'ExSkuCards', props: JSON.stringify({ skus: ids.map((id) => ({ id })) }) }] }] } },
    });

    it('accepts cards for registry SKUs, public or not', () => {
      expect(skuCardErrors({ skus, views: [view(['a', 'b'])] })).toEqual([]);
    });

    it('fails on a card for an id the registry lacks', () => {
      expect(skuCardErrors({ skus, views: [view(['a', 'z'])] })).toEqual([expect.stringMatching(/card for "z", which is not a SKU/)]);
    });

    it('fails on a SKU with a public repository and no card', () => {
      expect(skuCardErrors({ skus, views: [view(['b'])] })).toEqual([expect.stringMatching(/"a" has a public repository and no SKU card/)]);
    });
  });

  it('holds a README summary a cap card shows to the readiness rules', () => {
    const caps = [
      { name: 'exeris-caps-x', repo: { summary: 'Rate limiting as an Exeris capability.' } },
      { name: 'exeris-caps-y', repo: { summary: 'Production-grade rate limiting.' } },
      { name: 'exeris-caps-z', repo: null },
    ];
    expect(repoSummaryErrors({ caps, allow: [] })).toEqual([expect.stringMatching(/exeris-caps-y: "Production" reads as production/)]);
  });
});

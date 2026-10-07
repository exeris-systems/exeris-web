import { describe, expect, it } from 'vitest';
import caps from '../src/data/caps.json';
import claimsJson from '../src/data/claims.json';
import coldStart from '../src/data/cold-start.json';
import skus from '../src/data/skus.json';
import { megabytes, pairsIn, seconds } from '../src/app/blocks/claim-numbers';

const claims = claimsJson.claims as Record<string, { copy: string; quotable: boolean }>;

describe('build-time data', () => {
  it('draws the cold-start chart with the figures of the L14 comparison string, in its order', () => {
    const copy = claims['L14.comparison'].copy;
    let at = -1;
    for (const arm of coldStart.arms) {
      const figure = seconds(arm.spawnToFirstRequestMs);
      expect(copy.includes(figure), `${arm.arm} ${figure}`).toBe(true);
      expect(copy.indexOf(figure)).toBeGreaterThan(at);
      at = copy.indexOf(figure);
    }
  });

  it('shows the Exeris peak RSS the L14 absolute string states', () => {
    const exeris = coldStart.arms.find((a) => a.exeris);
    expect(claims['L14.absolute'].copy).toContain(`${megabytes(exeris!.peakRssMb)} peak RSS`);
  });

  it('finds the chart pairs inside the registered strings', () => {
    expect(pairsIn(claims['L12.comparison'].copy, 'vs')).toHaveLength(2);
    expect(pairsIn(claims['L13.tls-tax'].copy, '→')).toHaveLength(2);
    expect(pairsIn(claims['L1.copy'].copy, 'vs')).toHaveLength(1);
  });

  it('keeps the cap totals equal to the rows and every composed cap in the registry', () => {
    const t = caps.totals as Record<string, number>;
    expect(t['community'] + t['commercial'] + t['enterprise-private']).toBe(t['total']);
    expect(caps.caps).toHaveLength(t['total']);
    const names = new Set(caps.caps.map((c) => c.short));
    for (const s of skus.skus) for (const c of s.caps) expect(names.has(c), `${s.id}: ${c}`).toBe(true);
  });
});

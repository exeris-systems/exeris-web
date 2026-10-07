import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { checkContent, strayNumbers } from '../scripts/check-content.mjs';

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
    for (const ok of ['Java 25 LTS or newer', 'HTTP/1.1 and HTTP/2', 'JA3/JA4', 'Tier 2', 'Layer 6 caps', 'ADR-023', 'TRL-3 (PLATFORM)', 'Apache-2.0', 'B2B', '`i18n`', '/platform#tier-1']) {
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
});

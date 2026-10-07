import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { benchmarksUrl, parseCapRegistry, parseClaims, parseSkus } from '../scripts/lib/parsers.mjs';

const CLAIMS = `# Benchmark claims

## Registered claims

### L1

- **copy:** \`one string\`
- **fence:** a fence.
- **source:** [report](../results/reports/r.md)

### L2

- **copy (absolute):** \`absolute string\`
- **copy (TLS tax):** \`first\` — \`second\`
- **copy (comparison, evidence page only):** \`compared\`

### L3

- **copy:** none registered.

## Withdrawn

1. A withdrawn figure.

## Never quote alone

- A rule with a [link](x.md).
`;

describe('parseClaims', () => {
  const { claims, withdrawn, neverQuoteAlone } = parseClaims(CLAIMS);

  it('keys every copy line by claim id and slugged variant', () => {
    expect(Object.keys(claims).sort()).toEqual(['L1.copy', 'L2.absolute', 'L2.comparison', 'L2.tls-tax', 'L3.copy']);
    expect(claims['L2.tls-tax'].copy).toBe('first — second');
    expect(claims['L3.copy'].quotable).toBe(false);
    expect(claims['L1.copy'].sources[0].url).toBe('https://github.com/exeris-systems/exeris-benchmarks/blob/main/results/reports/r.md');
  });

  it('reads the withdrawn list and the rules', () => {
    expect(withdrawn).toEqual(['A withdrawn figure.']);
    expect(neverQuoteAlone).toEqual(['A rule with a link.']);
  });

  it('resolves directory links to tree URLs', () => {
    expect(benchmarksUrl('../results/raw/x/')).toBe('https://github.com/exeris-systems/exeris-benchmarks/tree/main/results/raw/x/');
  });
});

const REGISTRY = `## Totals

| Licence | Caps |
|---|---|
| \`community\` | 1 |
| \`commercial\` | 1 |
| **total** | **2** |

### Layer 1 — Substrate aggregates

| Cap | Licence | Visibility | Status |
|---|---|---|---|
| \`exeris-caps-a\` | \`commercial\` | public | specified |
| \`exeris-caps-b\` | \`community\` | public | **scaffolded** |
`;

describe('parseCapRegistry and parseSkus', () => {
  it('parses rows and checks the stated totals', () => {
    const r = parseCapRegistry(REGISTRY);
    expect(r.totals).toMatchObject({ community: 1, commercial: 1, total: 2 });
    expect(r.caps[1]).toMatchObject({ short: 'b', status: 'scaffolded', layer: 1 });
    expect(() => parseCapRegistry(REGISTRY.replace('| **total** | **2** |', '| **total** | **3** |'))).toThrow(/stated total/);
  });

  it('rejects a SKU composed of a cap the registry does not hold', () => {
    const hla = `### 3.3 SKU\n\n| **One** | Gateway | Source-available | \`a\`, \`zzz\` |\n\n## 4\n\n### 6.3 Tier 3\n\n| \`exeris-sku-one\` | commercial | Source-available (public) | |\n`;
    expect(() => parseSkus(hla, ['exeris-caps-a'])).toThrow(/zzz/);
    expect(parseSkus(hla.replace(', `zzz`', ''), ['exeris-caps-a'])[0]).toMatchObject({ id: 'one', capCount: 1 });
  });
});

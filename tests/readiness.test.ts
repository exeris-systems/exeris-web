import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { readinessHits, viewReadinessErrors } from '../scripts/check-content.mjs';
// @ts-expect-error -- plain ESM module without type declarations
import { sharedRelease, withSkuStatus } from '../scripts/lib/parsers.mjs';

const rules = (text: string, opts = {}): string[] => readinessHits(text, opts).map((h: { rule: string }) => h.rule);

describe('readiness wording', () => {
  it('rejects commercial and readiness phrases', () => {
    const cases: [string, string][] = [
      ['SKUs are sold as products', 'sold'],
      ['You can buy it', 'buy'],
      ['A separately purchased component', 'purchase'],
      ['Production support and CVE notification', 'support'],
      ['production-ready', 'production'],
      ['Backed by an SLA', 'sla'],
      ['CVE notification', 'cve'],
      ['The hosted control plane', 'hosted'],
      ['The hosted control plane', 'control-plane'],
      ['Production runtime licence', 'licence'],
      ['under the Exeris Commercial License', 'licence'],
      ['Subscribe to operate', 'licence'],
      ['air-gappable', 'air-gapped'],
      ['Cloud or on-prem', 'air-gapped'],
      ['Contact us', 'contact-sales'],
      ['Contact sales', 'contact-sales'],
      ['Discuss Enterprise fit', 'contact-sales'],
    ];
    for (const [text, rule] of cases) expect(rules(text), text).toContain(rule);
  });

  it('lets technical uses of the same words through', () => {
    for (const ok of [
      'The Apache-2.0 kernel and its SDK',
      'Spring controllers run on Exeris-owned request paths',
      'The kernel supports HTTP/2',
      'Design partners: direct work with the author',
      'A capability licence registry',
      'Hosted on the Exeris kernel, measured against Tomcat',
      'Code Detachment applies to the commercial caps and SKUs only',
    ]) {
      expect(rules(ok), ok).toEqual([]);
    }
  });

  it('rejects a link to the console, in prose or as an address', () => {
    expect(rules('https://console.exeris.eu/signin', { isLink: true })).toEqual(['console']);
    expect(rules('Sign in at console.exeris.eu')).toContain('console');
  });

  it('applies an allow-list entry only to its rule, its phrase and its view', () => {
    const allow = [{ rule: 'control-plane', view: 'sku-api-gateway', pattern: 'admin control plane', reason: 'test' }];
    expect(rules('the admin control plane', { view: 'sku-api-gateway', allow })).toEqual([]);
    expect(rules('the admin control plane', { view: 'home', allow })).toEqual(['control-plane']);
    expect(rules('the hosted control plane', { view: 'sku-api-gateway', allow })).toContain('hosted');
    expect(rules('a control plane for you', { view: 'sku-api-gateway', allow })).toEqual(['control-plane']);
  });
});

const view = (props: unknown, name = 'sku-x') => ({
  name,
  title: 'T',
  regions: [{ slot: 'main', components: [{ type: 'CUSTOM', customType: 'ExSkuCards', props: JSON.stringify(props) }] }],
});
const sku = (id: string, status: string) => ({ id, status });

describe('readiness of the copy attached to a SKU', () => {
  it('holds the copy of a poc SKU, a snapshot SKU and unattached copy to the rules', () => {
    for (const status of ['poc', 'snapshot']) {
      const errors = viewReadinessErrors('f', view({ sku: 'x', hero: 'Sold as a product' }), { skus: [sku('x', status)], allow: [] });
      expect(errors, status).toHaveLength(1);
    }
    expect(viewReadinessErrors('f', view({ hero: 'Sold as a product' }), { skus: [sku('x', 'released')], allow: [] })).toHaveLength(1);
  });

  it('exempts the copy of a released SKU only', () => {
    const skus = [sku('x', 'released'), sku('y', 'poc')];
    expect(viewReadinessErrors('f', view({ sku: 'x', hero: 'Sold as a product' }), { skus, allow: [] })).toEqual([]);
    const list = { skus: [{ id: 'x', description: 'Sold as a product' }, { id: 'y', description: 'Sold as a product' }] };
    const errors = viewReadinessErrors('f', view(list), { skus, allow: [] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('skus[1]');
  });

  it('holds the prose of a node that is not a CUSTOM block to the rules', () => {
    const richText = { type: 'RICH_TEXT', props: 'Production support is sold under an SLA' };
    const plain = { name: 'caps', title: 'T', regions: [{ slot: 'main', components: [{ type: 'CONTAINER', children: [richText] }] }] };
    const errors = viewReadinessErrors('f', plain, { skus: [], allow: [] });
    expect(errors.map((e: string) => e.match(/reads as ([a-z-]+)/)?.[1])).toEqual(expect.arrayContaining(['sold', 'support', 'sla']));
    expect(errors[0]).toContain('regions[0].components[0].children[0] props');

    const skus = [sku('x', 'released'), sku('y', 'poc')];
    const under = (id: string) => ({
      name: 'sku-x',
      title: 'T',
      regions: [{ slot: 'main', components: [{ type: 'CUSTOM', customType: 'ExSkuCards', props: JSON.stringify({ sku: id }), children: [richText] }] }],
    });
    expect(viewReadinessErrors('f', under('x'), { skus, allow: [] })).toEqual([]);
    expect(viewReadinessErrors('f', under('y'), { skus, allow: [] }).length).toBeGreaterThan(0);
  });

  it('holds the strings of an items list to the rules', () => {
    const map = { tiers: [{ items: ['Kernel SPI and Core', 'Production support'] }, { items: 'skus' }] };
    const errors = viewReadinessErrors('f', view(map), { skus: [], allow: [] });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((e: string) => e.includes('tiers[0].items[1]'))).toBe(true);
  });

  it('checks links as well as prose', () => {
    const errors = viewReadinessErrors('f', view({ ctas: [{ label: 'Open', href: 'https://console.exeris.eu' }] }), { skus: [], allow: [] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('console');
  });
});

describe('readiness in the data', () => {
  const caps = [
    { short: 'a', status: 'released' },
    { short: 'b', status: 'snapshot' },
    { short: 'c', status: 'poc' },
  ];
  const base = { family: 'F', closedSource: false, skuSpecificCaps: [] as string[] };

  it('gives a SKU the lowest status of its caps', () => {
    const [s1, s2] = withSkuStatus([{ id: '1', ...base, caps: ['a', 'b'] }, { id: '2', ...base, caps: ['a'] }], caps);
    expect(s1.status).toBe('snapshot');
    expect(s2.status).toBe('released');
  });

  it('never fails open: an unknown cap, a SKU-specific cap or no caps is poc', () => {
    const out = withSkuStatus(
      [{ id: '1', ...base, caps: ['a', 'zzz'] }, { id: '2', ...base, caps: ['a'], skuSpecificCaps: ['own cap'] }, { id: '3', ...base, caps: [] }],
      caps,
    );
    expect(out.map((s: { status: string }) => s.status)).toEqual(['poc', 'poc', 'poc']);
  });
});

describe('the published version', () => {
  it('is the one release every coordinate shares', () => {
    expect(sharedRelease({ a: '0.10.0', b: '0.10.0' })).toBe('0.10.0');
    expect(() => sharedRelease({ a: '0.10.0', b: '0.9.0' })).toThrow(/disagree/);
    expect(() => sharedRelease({ a: '0.10.0', b: null })).toThrow(/disagree/);
  });
});

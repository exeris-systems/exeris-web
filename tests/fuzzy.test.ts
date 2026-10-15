import { describe, expect, it } from 'vitest';
import { fuzzyScore, searchIndex, type SearchEntry } from '../src/app/shell/fuzzy';

const entries: SearchEntry[] = [
  { kind: 'page', title: 'Capabilities', href: '/capabilities' },
  { kind: 'sku', title: 'API Gateway', href: '/skus/api-gateway', hint: 'Gateway' },
  { kind: 'capability', title: 'rate-limiting', href: '/capabilities#cap-rate-limiting', keywords: 'gateway policies' },
  { kind: 'concept', title: 'The Wall', href: '/platform#wall' },
];

describe('command palette search', () => {
  it('matches subsequences and rejects missing characters', () => {
    expect(fuzzyScore('cap', 'Capabilities')).toBeGreaterThan(0);
    expect(fuzzyScore('apgw', 'API Gateway')).toBeGreaterThan(0);
    expect(fuzzyScore('xyz', 'API Gateway')).toBe(-1);
  });

  it('ranks title matches first and returns the index for an empty query', () => {
    expect(searchIndex(entries, 'gateway')[0].title).toBe('API Gateway');
    expect(searchIndex(entries, 'wall')[0].title).toBe('The Wall');
    expect(searchIndex(entries, '')).toHaveLength(entries.length);
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { plain, routeOf, toEntry } from '../projects/docs/src/app/search';

describe('docs search', () => {
  it('turns a Pagefind URL into the route the site serves', () => {
    expect(routeOf('/sdk/guides/02-model-a-domain/')).toBe('/sdk/guides/02-model-a-domain');
    expect(routeOf('/sdk/guides/02-model-a-domain/#steps')).toBe('/sdk/guides/02-model-a-domain#steps');
    expect(routeOf('/kernel/whitepaper/index.html')).toBe('/kernel/whitepaper');
    expect(routeOf('/')).toBe('/');
  });

  it('reads an excerpt as plain text', () => {
    expect(plain('the <mark>arena</mark> &amp; its &lt;slab&gt;\n pool')).toBe('the arena & its <slab> pool');
  });

  it('lists a result at the heading that matched, with its passage and section', () => {
    const entry = toEntry({
      url: '/kernel/subsystems/memory/',
      excerpt: 'page <mark>arena</mark>',
      meta: { title: 'Kernel Subsystem: Memory', section: 'Kernel · Subsystems' },
      sub_results: [{ title: 'Overview', url: '/kernel/subsystems/memory/#overview', excerpt: 'the <mark>arena</mark> pool' }],
    });
    expect(entry).toEqual({
      kind: 'text',
      title: 'Kernel Subsystem: Memory › Overview',
      href: '/kernel/subsystems/memory#overview',
      hint: 'Kernel · Subsystems',
      excerpt: 'the arena pool',
    });
  });

  it('lists the page itself when no heading matched', () => {
    const entry = toEntry({ url: '/sdk/glossary/', excerpt: 'a <mark>term</mark>', meta: { title: 'Glossary' } });
    expect(entry).toMatchObject({ title: 'Glossary', href: '/sdk/glossary', excerpt: 'a term' });
  });
});

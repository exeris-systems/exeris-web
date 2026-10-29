import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { buildDocs } from '../scripts/docs/fetch-docs.mjs';
// @ts-expect-error -- plain ESM module without type declarations
import { SANITIZE, isPublished, parseFrontmatter, renderDoc, rewriteHref, routeOf, slug, toTree } from '../scripts/docs/render.mjs';

const blob = (p: string) => `https://github.com/exeris-systems/exeris-kernel/blob/v1/${p}`;
const published = new Map([
  ['docs/subsystems/memory.md', 'kernel/subsystems/memory'],
  ['docs/architecture.md', 'kernel/architecture'],
]);

describe('frontmatter and publication', () => {
  it('publishes only what its repository marks public and active', () => {
    const { data, body } = parseFrontmatter('---\ntitle: "A"\nvisibility: public\nstatus: active\n---\n\n# A\n');
    expect(data.title).toBe('A');
    expect(body).toBe('\n# A\n');
    expect(isPublished(data)).toBe(true);
    expect(isPublished({ visibility: 'public', status: 'draft' })).toBe(false);
    expect(isPublished({ visibility: 'enterprise-private', status: 'active' })).toBe(false);
    expect(isPublished(parseFrontmatter('# no frontmatter').data)).toBe(false);
  });

  it('routes a file by its source and path', () => {
    expect(routeOf('kernel', 'docs/subsystems/memory.md')).toBe('kernel/subsystems/memory');
    expect(routeOf('platform', 'high-level-architecture.md')).toBe('platform/high-level-architecture');
  });
});

describe('links', () => {
  const ctx = { path: 'docs/subsystems/bootstrap.md', published, blob };

  it('sends a link to a published document to its route, anchor kept', () => {
    expect(rewriteHref('memory.md#leaks', ctx)).toBe('/kernel/subsystems/memory#leaks');
    expect(rewriteHref('../architecture.md', ctx)).toBe('/kernel/architecture');
  });

  it('sends any other relative link to GitHub at the ref read', () => {
    expect(rewriteHref('../adr/ADR-007.md', ctx)).toBe(blob('docs/adr/ADR-007.md'));
    expect(rewriteHref('../../pom.xml', ctx)).toBe(blob('pom.xml'));
  });

  it('keeps absolute links and in-page anchors', () => {
    expect(rewriteHref('https://exeris.eu/start', ctx)).toBe('https://exeris.eu/start');
    expect(rewriteHref('#overview', ctx)).toBe('#overview');
    expect(rewriteHref('mailto:a@b.c', ctx)).toBe('mailto:a@b.c');
  });
});

describe('rendering', () => {
  const ctx = { path: 'docs/subsystems/bootstrap.md', published, blob };

  it("gives headings GitHub's ids, numbered when repeated", () => {
    expect(slug('The Loan Pattern (RAII)')).toBe('the-loan-pattern-raii');
    const { html, headings } = renderDoc('# T\n\n## Unit Tests\n\n## Unit Tests\n', ctx);
    expect(html).toContain('<h2 id="unit-tests">');
    expect(html).toContain('<h2 id="unit-tests-1">');
    expect(headings.map((h: { id: string }) => h.id)).toEqual(['t', 'unit-tests', 'unit-tests-1']);
  });

  it('shows a Mermaid block as its source, marked as a diagram', () => {
    const { html } = renderDoc('```mermaid\ngraph TD; A-->B\n```\n', ctx);
    expect(html).toContain('<pre class="ex-doc__diagram"><code class="language-mermaid">graph TD; A--&gt;B');
  });

  it('removes script, event handlers and unlisted attributes from raw HTML, and keeps details', () => {
    const { html } = renderDoc('<script>x()</script>\n\n<details open><summary>S</summary>\n\nBody <img src="https://evil.example/a.png" onerror="x()">\n\n</details>\n\n<a href="javascript:x()">j</a>', ctx);
    expect(html).not.toMatch(/script|onerror|<img|javascript:/);
    expect(html).toContain('<details open');
    expect(html).toContain('<summary>S</summary>');
  });

  it('describes a page by its first paragraph of substance, on one line', () => {
    const { description } = renderDoc('# T\n\n**Layout:**\n\nThe memory subsystem implements the\nzero-allocation model for the kernel.\n', ctx);
    expect(description).toBe('The memory subsystem implements the zero-allocation model for the kernel.');
  });
});

describe('the document tree', () => {
  it('turns elements into tag, attributes and children, and text into strings', () => {
    expect(toTree('<h2 id="a">A <code>b</code></h2>\n<ul>\n<li>x</li>\n</ul>')).toEqual([
      { t: 'h2', a: { id: 'a' }, c: ['A ', { t: 'code', c: ['b'] }] },
      { t: 'ul', c: [{ t: 'li', c: ['x'] }] },
    ]);
  });

  it('keeps the whitespace of code and of inline text, and moves text-align to align', () => {
    expect(toTree('<pre><code>a\n  b\n</code></pre>')).toEqual([{ t: 'pre', c: [{ t: 'code', c: ['a\n  b\n'] }] }]);
    expect(toTree('<p><code>a</code> <code>b</code></p>')[0]).toEqual({ t: 'p', c: [{ t: 'code', c: ['a'] }, ' ', { t: 'code', c: ['b'] }] });
    expect(toTree('<td style="text-align:right">1</td>')).toEqual([{ t: 'td', a: { align: 'right' }, c: ['1'] }]);
  });

  it('is drawn by a template that has a case for every tag the build keeps', () => {
    const template = readFileSync(join(__dirname, '../projects/docs/src/app/doc-content.component.ts'), 'utf8');
    const cases = new Set([...template.matchAll(/@case \('([a-z0-9]+)'\)/g)].map((m) => m[1]));
    expect([...SANITIZE.allowedTags].filter((t: string) => !cases.has(t))).toEqual([]);
  });
});

describe('buildDocs', () => {
  const config = {
    sources: { kernel: { repo: 'exeris-kernel', ref: 'release', route: 'kernel' } },
    sections: [{ id: 'kernel', label: 'Kernel', files: ['kernel:docs/a.md', 'kernel:docs/b.md'] }],
  };
  const files: Record<string, string> = {
    'docs/a.md': '---\ntitle: "A `x`"\nvisibility: public\nstatus: active\n---\n\n# A\n\nSee [b](b.md) for the rest of it.\n',
    'docs/b.md': '---\nvisibility: public\nstatus: draft\n---\n\n# B\n',
  };
  const read = async (_repo: string, _ref: string, path: string) => files[path];

  it('publishes the public, active files and reports the others', async () => {
    const { pages, skipped } = await buildDocs(config, { read, refs: { kernel: 'v1' } });
    expect(pages.map((p: { route: string }) => p.route)).toEqual(['kernel/a']);
    expect(pages[0].title).toBe('A x');
    expect(pages[0].source.url).toBe('https://github.com/exeris-systems/exeris-kernel/blob/v1/docs/a.md');
    expect(pages[0].html).toContain(`href="${'https://github.com/exeris-systems/exeris-kernel/blob/v1/docs/b.md'}"`);
    expect(skipped).toEqual(['kernel:docs/b.md (visibility public, status draft)']);
  });

  it('fails on a listed file of an unknown source', async () => {
    await expect(buildDocs({ ...config, sections: [{ id: 'x', label: 'X', files: ['nope:a.md'] }] }, { read, refs: {} })).rejects.toThrow(/names no source nope/);
  });
});

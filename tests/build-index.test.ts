import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM module without type declarations
import { buildIndex, docHint } from '../scripts/build-index.mjs';

describe('the command-palette index', () => {
  it('marks the documents on docs.exeris.eu as Docs and the rest as GitHub', () => {
    const docs = buildIndex().filter((e: { kind: string }) => e.kind === 'doc');
    const hint = (title: string) => docs.find((d: { title: string }) => d.title === title)?.hint;
    expect(hint('Kernel whitepaper')).toBe('Docs');
    expect(hint('High-level architecture')).toBe('Docs');
    expect(hint('Capability licence registry')).toBe('Docs');
    expect(hint('ADR index')).toBe('GitHub');
  });

  it('decides by the host, not by a prefix of the address', () => {
    expect(docHint('https://docs.exeris.eu/kernel/whitepaper')).toBe('Docs');
    expect(docHint('https://docs.exeris.eu.example/kernel/whitepaper')).toBe('GitHub');
    expect(docHint('https://github.com/exeris-systems/exeris-docs')).toBe('GitHub');
  });
});

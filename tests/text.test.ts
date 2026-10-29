import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { segments } from '../src/app/blocks/text.component';

describe('segments', () => {
  it('resolves site tokens in authored text', () => {
    expect(segments('{caps.total} caps').map((s) => s.kind)).toEqual(['count', 'text']);
  });

  it('keeps braces of upstream text literal and still splits code spans', () => {
    expect(segments('a {caps.bogus} `b`', false)).toEqual([
      { kind: 'text', value: 'a {caps.bogus} ' },
      { kind: 'code', value: 'b' },
    ]);
  });
});

describe('the cap card', () => {
  it('renders a README sentence with site tokens off', () => {
    const src = readFileSync(join(__dirname, '../src/app/blocks/cap-matrix.block.ts'), 'utf8');
    expect(src).toMatch(/<ex-text \[text\]="repo\.summary" \[tokens\]="false" \/>/);
  });
});

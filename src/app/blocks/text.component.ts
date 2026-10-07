import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { structuralCount } from '../data/data';

interface Segment {
  readonly kind: 'text' | 'code' | 'count';
  readonly value: string;
}

/**
 * Splits authored text into plain runs, `code` spans (between backticks) and structural counts
 * (`{caps.total}`, resolved from the registers). Only text nodes are created: content never
 * reaches the DOM as HTML.
 */
export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /`([^`]+)`|\{([a-z.:-]+)\}/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ kind: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: 'code', value: m[1] });
    else out.push({ kind: 'count', value: String(structuralCount(m[2])) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
  return out;
}

@Component({
  selector: 'ex-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (s of parts(); track $index) {@if (s.kind === 'code') {<code class="ex-inline-code">{{ s.value }}</code>} @else {<ng-container>{{ s.value }}</ng-container>}}`,
})
export class TextComponent {
  readonly text = input.required<string>();
  protected readonly parts = computed(() => segments(this.text()));
}

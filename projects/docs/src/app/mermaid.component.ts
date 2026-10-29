import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, input, signal, viewChild } from '@angular/core';

let sequence = 0;
/** Mermaid renders one diagram at a time; concurrent renders on one page interfere. */
let queue: Promise<unknown> = Promise.resolve();
let loaded: Promise<typeof import('mermaid')['default']> | null = null;

function mermaid(): Promise<typeof import('mermaid')['default']> {
  loaded ??= import('mermaid').then(({ default: m }) => {
    m.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'dark', fontFamily: 'IBM Plex Sans, system-ui, sans-serif' });
    return m;
  });
  return loaded;
}

/**
 * A Mermaid diagram. The prerendered page shows its source; in the browser the diagram is drawn
 * from it, with Mermaid loaded from this site only on a page that has one. Mermaid runs with
 * securityLevel "strict" (its own sanitising of labels), and its SVG is parsed with DOMParser and
 * appended as nodes, so no HTML string is inserted. If drawing fails, the source stays.
 */
@Component({
  selector: 'ex-mermaid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #out class="ex-mermaid" [hidden]="!drawn()" role="img" [attr.aria-label]="'Diagram'"></div>
    <pre class="ex-doc__diagram" [hidden]="drawn()"><code class="language-mermaid">{{ source() }}</code></pre>
  `,
})
export class MermaidComponent {
  readonly source = input.required<string>();
  protected readonly drawn = signal(false);
  private readonly out = viewChild.required<ElementRef<HTMLElement>>('out');

  constructor() {
    afterNextRender(() => {
      queue = queue.then(() => this.draw());
    });
  }

  private async draw(): Promise<void> {
    try {
      const { svg } = await (await mermaid()).render(`ex-mermaid-${++sequence}`, this.source());
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const root = doc.documentElement;
      if (root.nodeName !== 'svg') return;
      this.out().nativeElement.appendChild(document.importNode(root, true));
      this.drawn.set(true);
    } catch {
      // Not valid Mermaid, or Mermaid failed to load: the source stays visible.
    }
  }
}

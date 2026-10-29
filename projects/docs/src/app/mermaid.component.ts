import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, input, signal, viewChild } from '@angular/core';
import { drawDiagram } from './mermaid-draw';

let sequence = 0;
/** Mermaid renders one diagram at a time; concurrent renders on one page interfere. */
let queue: Promise<unknown> = Promise.resolve();
let loaded: Promise<typeof import('mermaid')['default']> | null = null;

function mermaid(): Promise<typeof import('mermaid')['default']> {
  loaded ??= import('mermaid').then(({ default: m }) => {
    // suppressErrorRendering: a diagram that does not parse throws instead of leaving Mermaid's
    // error graphic on the page; the component then keeps showing the source.
    m.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      theme: 'dark',
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
    });
    return m;
  });
  return loaded;
}

/**
 * A Mermaid diagram. The prerendered page shows its source; in the browser the diagram is drawn
 * from it (drawDiagram), with Mermaid loaded from this site only on a page that has one and run
 * with securityLevel "strict", its own sanitising of labels. If drawing fails, the source stays.
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
      this.drawn.set(await drawDiagram(await mermaid(), `ex-mermaid-${++sequence}`, this.source(), this.out().nativeElement));
    } catch {
      // Mermaid failed to load: the source stays visible.
    }
  }
}

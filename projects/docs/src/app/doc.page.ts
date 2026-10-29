import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DocContentComponent } from './doc-content.component';
import type { DocNode } from './doc-types';
import { pageById } from './docs';
import { SidebarComponent } from './sidebar.component';

/** One documentation page: the sections beside, the document, its contents and its source. */
@Component({
  selector: 'ex-docs-page',
  imports: [SidebarComponent, DocContentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ex-container ex-docs">
      <ex-docs-sidebar [current]="page().id" />
      <article class="ex-doc prose prose-invert max-w-none"><ex-doc-content [tree]="tree()" /></article>
      <aside class="ex-docs-toc" aria-label="On this page">
        @if (page().headings.length) {
          <h2 class="ex-eyebrow">On this page</h2>
          <ul>
            @for (h of page().headings; track h.id) {
              <li [class.ex-docs-toc__sub]="h.level === 3"><a [href]="'/' + page().route + '#' + h.id">{{ h.text }}</a></li>
            }
          </ul>
        }
        <p class="ex-docs-toc__source">
          <a [href]="page().source.url">{{ page().source.repo }}/{{ page().source.path }}</a>
          at {{ page().source.ref.length === 40 ? page().source.ref.slice(0, 7) : page().source.ref }}
        </p>
      </aside>
    </div>
  `,
})
export class DocPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly page = computed(() => pageById(this.data()['id'] as string));
  protected readonly tree = toSignal(this.route.data.pipe(map((d) => d['tree'] as readonly DocNode[])), {
    initialValue: this.route.snapshot.data['tree'] as readonly DocNode[],
  });
}

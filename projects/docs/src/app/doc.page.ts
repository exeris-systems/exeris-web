import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { DocContentComponent } from './doc-content.component';
import type { DocContent } from './doc-types';
import { groupOf, navTitle, neighbours, pageById, sectionOf, sectionRoute, sourceUrl } from './docs';
import { SidebarComponent } from './sidebar.component';

/**
 * One documentation page: the navigation beside, then where the page sits (group and section),
 * the document, the pages before and after it in its group, and its contents and source.
 */
@Component({
  selector: 'ex-docs-page',
  imports: [SidebarComponent, DocContentComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ex-container ex-docs">
      <ex-docs-sidebar [current]="page().id" />
      <div class="ex-docs-main">
        <nav class="ex-docs-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a routerLink="/">Docs</a></li>
            <li><a [routerLink]="'/'" [fragment]="group().id">{{ group().label }}</a></li>
            <li><a [routerLink]="sectionLink()">{{ section().label }}</a></li>
          </ol>
        </nav>
        <!-- The search index (Pagefind, at build time) reads only this element and its section. -->
        <article class="ex-doc prose prose-invert max-w-none" data-pagefind-body [attr.data-pagefind-meta]="'section:' + group().label + ' · ' + section().label">
          <ex-doc-content [tree]="doc().tree" />
        </article>
        <nav class="ex-docs-pager" aria-label="Pages in this group">
          @if (around().prev; as prev) {
            <a class="ex-docs-pager__link" [routerLink]="'/' + prev.route" rel="prev">
              <span class="ex-docs-pager__dir">Previous</span>
              <span class="ex-docs-pager__title">{{ label(prev) }}</span>
            </a>
          }
          @if (around().next; as next) {
            <a class="ex-docs-pager__link ex-docs-pager__link--next" [routerLink]="'/' + next.route" rel="next">
              <span class="ex-docs-pager__dir">Next</span>
              <span class="ex-docs-pager__title">{{ label(next) }}</span>
            </a>
          }
        </nav>
      </div>
      <aside class="ex-docs-toc" aria-label="On this page">
        @if (doc().headings.length) {
          <h2 class="ex-eyebrow">On this page</h2>
          <ul>
            @for (h of doc().headings; track h.id) {
              <li [class.ex-docs-toc__sub]="h.level === 3"><a [href]="'/' + page().route + '#' + h.id">{{ h.text }}</a></li>
            }
          </ul>
        }
        <p class="ex-docs-toc__source">
          <a [href]="source()">{{ page().source.repo }}/{{ page().source.path }}</a>
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
  protected readonly section = computed(() => sectionOf(this.page()));
  protected readonly group = computed(() => groupOf(this.section()));
  protected readonly sectionLink = computed(() => sectionRoute(this.section()));
  protected readonly around = computed(() => neighbours(this.page()));
  protected readonly source = computed(() => sourceUrl(this.page()));
  protected readonly doc = toSignal(this.route.data.pipe(map((d) => d['doc'] as DocContent)), {
    initialValue: this.route.snapshot.data['doc'] as DocContent,
  });

  protected label(p: Parameters<typeof navTitle>[0]): string {
    return navTitle(p);
  }
}

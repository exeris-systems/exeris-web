import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { groupOf, sectionById } from './docs';
import { SidebarComponent } from './sidebar.component';

/** One section as a list: each page with the first paragraph of its document. */
@Component({
  selector: 'ex-docs-section',
  imports: [SidebarComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ex-container ex-docs ex-docs--wide">
      <ex-docs-sidebar [currentSection]="section().id" />
      <div class="ex-docs-main">
        <nav class="ex-docs-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a routerLink="/">Docs</a></li>
            <li><a [routerLink]="'/'" [fragment]="group().id">{{ group().label }}</a></li>
          </ol>
        </nav>
        <h1 class="ex-docs-section-title">{{ section().label }}</h1>
        <p class="ex-docs-section-count">{{ section().pages.length }} {{ section().pages.length === 1 ? 'page' : 'pages' }} in {{ group().label }}</p>
        <ul class="ex-docs-list">
          @for (p of section().pages; track p.id) {
            <li>
              <a [routerLink]="'/' + p.route">
                <span class="ex-docs-list__title">{{ p.title }}</span>
                @if (p.description) {
                  <span class="ex-docs-list__desc">{{ p.description }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class SectionPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly section = computed(() => {
    const id = this.data()['section'] as string;
    const section = sectionById(id);
    if (!section) throw new Error(`no docs section "${id}"`);
    return section;
  });
  protected readonly group = computed(() => groupOf(this.section()));
}

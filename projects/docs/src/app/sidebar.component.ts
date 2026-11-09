import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_SECTIONS } from './docs';

/**
 * Every section and its pages, in the order of projects/docs/sources.json. A section is a
 * disclosure, open when it holds the current page, so the list stays short beside a page while
 * every page remains one click away.
 */
@Component({
  selector: 'ex-docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ex-docs-side' },
  template: `
    <nav class="ex-docs-nav" aria-label="Documentation">
      @for (s of sections; track s.id) {
        <details class="ex-docs-nav__group" [open]="s.id === section()">
          <summary class="ex-eyebrow">{{ s.label }} <span class="ex-docs-nav__count">{{ s.pages.length }}</span></summary>
          <ul>
            @for (p of s.pages; track p.id) {
              <li>
                <a [routerLink]="'/' + p.route" routerLinkActive="is-active" [attr.aria-current]="current() === p.id ? 'page' : null">{{ p.title }}</a>
              </li>
            }
          </ul>
        </details>
      }
    </nav>
  `,
})
export class SidebarComponent {
  readonly current = input<string | null>(null);
  protected readonly sections = NAV_SECTIONS;
  protected readonly section = computed(() => NAV_SECTIONS.find((s) => s.pages.some((p) => p.id === this.current()))?.id ?? null);
}

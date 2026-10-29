import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_SECTIONS } from './docs';

/** Every section and its pages, in the order of projects/docs/sources.json. */
@Component({
  selector: 'ex-docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ex-docs-side' },
  template: `
    <nav class="ex-docs-nav" aria-label="Documentation">
      @for (s of sections; track s.id) {
        <div class="ex-docs-nav__group">
          <h2 class="ex-eyebrow">{{ s.label }}</h2>
          <ul>
            @for (p of s.pages; track p.id) {
              <li>
                <a [routerLink]="'/' + p.route" routerLinkActive="is-active" [attr.aria-current]="current() === p.id ? 'page' : null">{{ p.title }}</a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class SidebarComponent {
  readonly current = input<string | null>(null);
  protected readonly sections = NAV_SECTIONS;
}

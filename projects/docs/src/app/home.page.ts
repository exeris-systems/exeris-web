import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_SECTIONS, SOURCE_REFS } from './docs';

/** The section list: every published page, grouped as the sidebar groups them. */
@Component({
  selector: 'ex-docs-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <p class="ex-eyebrow">DOCUMENTATION</p>
        <h1 class="ex-docs-title">Exeris documentation</h1>
        <p class="ex-docs-lede">
          The kernel at its release {{ refs['kernel'] }}, and the platform documents of exeris-docs, rendered from
          their repositories when this site is built.
        </p>
        <div class="ex-grid ex-grid--3 ex-docs-home">
          @for (s of sections; track s.id) {
            <div class="ex-card">
              <h2 class="ex-eyebrow">{{ s.label }}</h2>
              <ul>
                @for (p of s.pages; track p.id) {
                  <li><a [routerLink]="'/' + p.route">{{ p.title }}</a></li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomePageComponent {
  protected readonly sections = NAV_SECTIONS;
  protected readonly refs = SOURCE_REFS;
}

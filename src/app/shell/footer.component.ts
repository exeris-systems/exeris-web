import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FOOTER_COLUMNS, FOOTER_LEGAL, FOOTER_TAGLINE } from '../../content/site';
import { BUILD_META, SITE_SHA } from '../data/data';
import { HrefDirective } from './href.directive';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'ex-footer',
  imports: [HrefDirective, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="ex-footer">
      <div class="ex-container">
        <div class="ex-footer__grid">
          <div class="ex-footer__brand">
            <ex-logo />
            <p>{{ tagline }}</p>
          </div>
          @for (col of columns; track col.title) {
            <nav class="ex-footer__col" [attr.aria-label]="col.title">
              <h2>{{ col.title }}</h2>
              <ul>
                @for (link of col.links; track link.href) {
                  <li><a [exHref]="link.href">{{ link.label }}</a></li>
                }
              </ul>
            </nav>
          }
        </div>
        <div class="ex-footer__legal">
          <p>{{ legal.join(' · ') }}</p>
          <p class="ex-mono">
            kernel <a [href]="kernel.url">{{ kernel.tag }}</a>
            @if (sha) {
              · site <a [href]="'https://github.com/exeris-systems/exeris-web/commit/' + sha">{{ sha.slice(0, 7) }}</a>
            }
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly tagline = FOOTER_TAGLINE;
  protected readonly columns = FOOTER_COLUMNS;
  protected readonly legal = FOOTER_LEGAL;
  protected readonly kernel = BUILD_META.kernel;
  protected readonly sha = SITE_SHA;
}

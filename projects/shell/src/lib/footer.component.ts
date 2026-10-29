import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SHELL_CONFIG } from './config';
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
  private readonly config = inject(SHELL_CONFIG);
  protected readonly tagline = this.config.footer.tagline;
  protected readonly columns = this.config.footer.columns;
  protected readonly legal = this.config.footer.legal;
  protected readonly kernel = this.config.build.kernel;
  protected readonly sha = this.config.build.siteSha;
}

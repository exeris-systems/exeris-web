import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The brand kit's horizontal lockup, linked home. The SVG file is used as shipped. */
@Component({
  selector: 'ex-logo',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/" class="ex-logo" aria-label="Exeris home">
      <img src="/assets/brand/exeris-lockup-h-dark.svg" alt="Exeris" width="114" height="28" />
    </a>
  `,
})
export class LogoComponent {}

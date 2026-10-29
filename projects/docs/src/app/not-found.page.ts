import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ex-docs-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <p class="ex-eyebrow">NOT FOUND</p>
        <h1 class="ex-docs-title">Page not found</h1>
        <p class="ex-docs-lede">This address is not a page of the Exeris documentation. <a routerLink="/">See every page</a>.</p>
      </div>
    </section>
  `,
})
export class NotFoundPageComponent {}

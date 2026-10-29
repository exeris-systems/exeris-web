import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Placeholder until the first content lands; the application is not deployed yet. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <h1>Exeris documentation</h1>
        <p>The documentation of the Exeris kernel, SDK and tooling, rendered from the public repositories at build time.</p>
      </div>
    </section>
  `,
})
export class HomePageComponent {}
